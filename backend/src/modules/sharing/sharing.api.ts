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
import type { SharedPlanRepository } from './application/ports.ts';

export interface SharingApiDeps {
  plans: SharedPlanRepository;
  clock: Clock;
}

// A share link is owned by a scope, so an id that is neither a document id nor the demo scope is refused rather than
// silently filed under the demo account.
function requireScopeId(id: string, demoId: string, label: string): ObjectId {
  const scopeId = toScopeId(id, demoId);
  if (!scopeId) throw new DomainError(SHARING_ERROR_CODES.invariantViolated, `unusable ${label} scope id`);
  return scopeId;
}

export function createSharingApi(deps: SharingApiDeps) {
  const { plans, clock } = deps;

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

      await plans.create({
        shareToken: token,
        tenantId: requireScopeId(tenantId, DEFAULT_TENANT_ID, 'tenant'),
        userId: requireScopeId(userId, DEFAULT_USER_ID, 'user'),
        ownerDisplayName: 'Elena',
        privacyMasked: input.privacyMasked ?? true,
        planSnapshot: {
          recommendedWeights: {
            'CSPX.LSE': 0.4,
            'IEAC.LSE': 0.35,
            'XEON.XETRA': 0.25,
          },
          currentWeights: {
            'CSPX.LSE': 0.6,
            'IEAC.LSE': 0.25,
            'XEON.XETRA': 0.15,
          },
          threePillarRationale: {
            personalFinance: 'Runway expanded to 6.4 months by buffering short-term liabilities.',
            crossBorder: 'Protected remittances against EUR/CNY exchange rate volatility.',
            wealthStrategy: 'Reduced US equity concentration risk from 60% to 40%.',
          },
          stressTestScenario: {
            fxShockPercent: -5.0,
            estimatedDrawdownPercent: 1.8,
          },
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
