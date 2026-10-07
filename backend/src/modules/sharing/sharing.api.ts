import type { ObjectId } from 'mongodb';
import { generateOpaqueToken } from '#core/crypto/random-token.ts';
import { DEFAULT_TENANT_ID, DEFAULT_USER_ID, toScopeId } from '#core/db/document-id.ts';
import { DomainError } from '#core/domain/domain-error.ts';
import type { Clock } from '#core/time/clock.ts';
import { SHARING_ERROR_CODES } from '@wealth-advisor/rules';
import type {
  CreateShareLinkRequest,
  CreateShareLinkResponse,
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
      const token = `dewa_sec_${generateOpaqueToken(6)}`;
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
      if (!plan) throw new DomainError(SHARING_ERROR_CODES.planNotFound, `shared plan ${token} not found`);

      if (plan.expiresAt < clock.now()) {
        throw new DomainError(SHARING_ERROR_CODES.planExpired, `shared plan ${token} has expired`);
      }

      return {
        shareToken: plan.shareToken,
        ownerDisplayName: plan.ownerDisplayName,
        privacyMasked: plan.privacyMasked,
        planSnapshot: plan.planSnapshot,
        expiresAt: plan.expiresAt.toISOString(),
        createdAt: plan.createdAt.toISOString(),
      };
    },
  };
}

export type SharingApi = ReturnType<typeof createSharingApi>;
