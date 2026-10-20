// In-app engagement event tracking over Vercel Web Analytics.
// Privacy rule: event properties contain enums and booleans only.
// No amounts, instrument names, account IDs, or free-text strings.

export const ENGAGEMENT_EVENTS = {
  copilotMessageSent: 'copilot_message_sent',
  stressSimulationRun: 'stress_simulation_run',
  shareLinkCreated: 'share_link_created',
  rebalanceProposalApproved: 'rebalance_proposal_approved',
  passkeyStepupCompleted: 'passkey_stepup_completed',
} as const;

export type EngagementEvent = (typeof ENGAGEMENT_EVENTS)[keyof typeof ENGAGEMENT_EVENTS];

export interface CopilotMessageSentProps {
  hasPresetPrompt: boolean;
  locale: 'en' | 'de' | 'zh-CN' | 'zh-HK';
}

export interface StressSimulationRunProps {
  scenario: 'EUR_SHOCK_5' | 'EUR_SHOCK_10' | 'TECH_DRAWDOWN_25' | 'EM_CORRIDOR_SPIKE';
  hasCustomShock: boolean;
}

export interface ShareLinkCreatedProps {
  isMasked: boolean;
  hasExpiry: boolean;
}

export interface RebalanceProposalApprovedProps {
  tier: 'TIER_3_EXECUTE' | 'TIER_2_SIMULATE';
  isPasskeyGated: boolean;
}

export interface PasskeyStepupCompletedProps {
  success: boolean;
  flow: 'REBALANCE' | 'EXPORT' | 'SETTINGS';
}

export interface EngagementEventPropsMap {
  [ENGAGEMENT_EVENTS.copilotMessageSent]: CopilotMessageSentProps;
  [ENGAGEMENT_EVENTS.stressSimulationRun]: StressSimulationRunProps;
  [ENGAGEMENT_EVENTS.shareLinkCreated]: ShareLinkCreatedProps;
  [ENGAGEMENT_EVENTS.rebalanceProposalApproved]: RebalanceProposalApprovedProps;
  [ENGAGEMENT_EVENTS.passkeyStepupCompleted]: PasskeyStepupCompletedProps;
}

export interface TrackPayload<E extends EngagementEvent = EngagementEvent> {
  name: E;
  data: EngagementEventPropsMap[E];
}

// Dispatches a typed, privacy-guaranteed analytics event to Vercel Web Analytics.
// Fire-and-forget: swallows all errors so user actions never fail or block.
export function track<E extends EngagementEvent>(
  event: E,
  props: EngagementEventPropsMap[E],
): TrackPayload<E> {
  const payload: TrackPayload<E> = { name: event, data: props };
  try {
    if (typeof window !== 'undefined' && typeof window.va === 'function') {
      window.va('event', payload as unknown as { name: string; data?: Record<string, string | number | boolean> });
    }
  } catch {
    // Fire-and-forget: sink failures never affect the user.
  }
  return payload;
}
