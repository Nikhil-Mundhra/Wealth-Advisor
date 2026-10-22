import type { ObjectId } from 'mongodb';
import { generateOpaqueToken } from '#core/crypto/random-token.ts';
import { DEFAULT_TENANT_ID, DEFAULT_USER_ID, toScopeId } from '#core/db/document-id.ts';
import { DomainError } from '#core/domain/domain-error.ts';
import type { Clock } from '#core/time/clock.ts';
import { SHARING_ERROR_CODES } from '@wealth-advisor/rules';
import type {
  CreateShareLinkRequest,
  CreateShareLinkResponse,
  ListSharedPlansResponse,
  PlanSnapshotDto,
  RevokeShareLinkResponse,
  SharedPlanResponse,
} from '@wealth-advisor/contracts';
import type { WealthApi } from '../wealth/public.ts';
import type { SharedPlanRepository } from './application/ports.ts';

export interface SharingApiDeps {
  plans: SharedPlanRepository;
  wealth: WealthApi;
  clock: Clock;
}

const UNNAMED_OWNER = 'DEWA client';

// A share link is owned by a scope, so an id that is neither a document id nor the demo scope is refused rather than
// silently filed under the demo account.
function requireScopeId(id: string, demoId: string, label: string): ObjectId {
  const scopeId = toScopeId(id, demoId);
  if (!scopeId) throw new DomainError(SHARING_ERROR_CODES.invariantViolated, `unusable ${label} scope id`);
  return scopeId;
}

export function createSharingApi(deps: SharingApiDeps) {
  const { plans, wealth, clock } = deps;

  return {
    async createShareLink(
      tenantId: string,
      userId: string,
      input: CreateShareLinkRequest,
    ): Promise<CreateShareLinkResponse> {
      const now = clock.now();
      const ttlHours = input.ttlHours ?? 72;
      const expiresAt = new Date(now.getTime() + ttlHours * 3600000);
      // 16 random bytes (128 bits): a share token is a bearer capability until it expires.
      const token = `dewa_sec_${generateOpaqueToken(16)}`;
      // The snapshot is the caller's own rebalance proposal at the moment of sharing.
      const proposal = await wealth.optimizePortfolio(tenantId, userId);

      await plans.create({
        shareToken: token,
        tenantId: requireScopeId(tenantId, DEFAULT_TENANT_ID, 'tenant'),
        userId: requireScopeId(userId, DEFAULT_USER_ID, 'user'),
        ownerDisplayName: input.ownerDisplayName ?? UNNAMED_OWNER,
        privacyMasked: input.privacyMasked ?? true,
        planSnapshot: {
          recommendedWeights: proposal.targetWeights,
          currentWeights: proposal.currentWeights,
          threePillarRationale: proposal.rationale,
          stressTestScenario: null,
        },
        passphraseHash: null,
        expiresAt,
        createdAt: now,
      });

      return {
        shareToken: token,
        url: `/share/${token}`,
        expiresAt: expiresAt.toISOString(),
      };
    },

    async getSharedPlan(token: string): Promise<SharedPlanResponse> {
      const plan = await plans.findByToken(token);
      if (!plan || plan.revokedAt) {
        throw new DomainError(SHARING_ERROR_CODES.planNotFound, `shared plan ${token} not found`);
      }

      if (plan.expiresAt < clock.now()) {
        throw new DomainError(SHARING_ERROR_CODES.planExpired, `shared plan ${token} has expired`);
      }

      return {
        shareToken: plan.shareToken,
        ownerDisplayName: plan.ownerDisplayName,
        privacyMasked: plan.privacyMasked,
        planSnapshot: plan.privacyMasked ? maskPlanSnapshot(plan.planSnapshot) : plan.planSnapshot,
        expiresAt: plan.expiresAt.toISOString(),
        createdAt: plan.createdAt.toISOString(),
      };
    },

    async listSharedPlans(
      tenantId: string,
      userId: string,
      options?: { clientId?: string; isAdvisorOrAdmin?: boolean },
    ): Promise<ListSharedPlansResponse> {
      const targetUserId = options?.clientId ?? userId;
      if (targetUserId !== userId && !options?.isAdvisorOrAdmin) {
        throw new DomainError(SHARING_ERROR_CODES.scopeForbidden, 'only an advisor may view a client shared plans');
      }
      const tenantObjectId = requireScopeId(tenantId, DEFAULT_TENANT_ID, 'tenant');
      const userObjectId = requireScopeId(targetUserId, DEFAULT_USER_ID, 'user');
      const docs = await plans.listByTarget(tenantObjectId, userObjectId);

      return {
        plans: docs.map((doc) => ({
          shareToken: doc.shareToken,
          ownerDisplayName: doc.ownerDisplayName,
          privacyMasked: doc.privacyMasked,
          expiresAt: doc.expiresAt.toISOString(),
          createdAt: doc.createdAt.toISOString(),
          revokedAt: doc.revokedAt ? doc.revokedAt.toISOString() : null,
        })),
      };
    },

    async revokeShareLink(
      tenantId: string,
      userId: string,
      shareToken: string,
      options?: { isAdvisorOrAdmin?: boolean },
    ): Promise<RevokeShareLinkResponse> {
      const plan = await plans.findByToken(shareToken);
      if (!plan) throw new DomainError(SHARING_ERROR_CODES.planNotFound, `shared plan ${shareToken} not found`);

      const tenantObjectId = requireScopeId(tenantId, DEFAULT_TENANT_ID, 'tenant');
      if (!plan.tenantId.equals(tenantObjectId)) {
        throw new DomainError(SHARING_ERROR_CODES.scopeForbidden, 'cannot revoke share link across tenants');
      }

      const callerUserObjectId = requireScopeId(userId, DEFAULT_USER_ID, 'user');
      const isOwner = plan.userId.equals(callerUserObjectId);
      if (!isOwner && !options?.isAdvisorOrAdmin) {
        throw new DomainError(
          SHARING_ERROR_CODES.scopeForbidden,
          'only the plan owner or an advisor may revoke this share link',
        );
      }

      const now = clock.now();
      await plans.revoke(tenantObjectId, shareToken, now);
      return {
        revoked: true,
        shareToken,
      };
    },
  };
}

function maskPlanSnapshot(snapshot: PlanSnapshotDto): PlanSnapshotDto {
  // One label per symbol across both weight maps, so a holding keeps the same anonymous name everywhere.
  const labels = new Map<string, string>();
  const labelFor = (symbol: string): string => {
    const existing = labels.get(symbol);
    if (existing) return existing;
    const label = `Holding ${labels.size + 1}`;
    labels.set(symbol, label);
    return label;
  };
  for (const symbol of [...Object.keys(snapshot.recommendedWeights), ...Object.keys(snapshot.currentWeights)]) {
    labelFor(symbol);
  }

  const maskWeights = (weights: Record<string, number>) => {
    const masked: Record<string, number> = {};
    for (const [symbol, weight] of Object.entries(weights)) {
      masked[labelFor(symbol)] = weight;
    }
    return masked;
  };
  const maskAmounts = (text: string) => text.replace(/[$€£¥]\s*\d+(?:[.,]\d+)*/g, '€***');
  // The rationale names tickers even when the weight map is anonymized; the mask has to cover both.
  const maskText = (text: string) => {
    let masked = maskAmounts(text);
    for (const [symbol, label] of [...labels.entries()].sort(([a], [b]) => b.length - a.length)) {
      masked = masked.split(symbol).join(label);
    }
    return masked;
  };

  return {
    ...snapshot,
    currentWeights: maskWeights(snapshot.currentWeights),
    recommendedWeights: maskWeights(snapshot.recommendedWeights),
    threePillarRationale: {
      personalFinance: maskText(snapshot.threePillarRationale.personalFinance),
      crossBorder: maskText(snapshot.threePillarRationale.crossBorder),
      wealthStrategy: maskText(snapshot.threePillarRationale.wealthStrategy),
    },
  };
}

export type SharingApi = ReturnType<typeof createSharingApi>;
