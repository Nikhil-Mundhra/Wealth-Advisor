import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ENGAGEMENT_EVENTS, track } from './engagement.ts';

describe('engagement tracking', () => {
  beforeEach(() => {
    vi.stubGlobal('va', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps known events to the expected payload and dispatches to window.va', () => {
    const vaMock = vi.fn();
    window.va = vaMock;

    const payload = track(ENGAGEMENT_EVENTS.copilotMessageSent, {
      hasPresetPrompt: false,
      locale: 'en',
    });

    expect(payload).toEqual({
      name: 'copilot_message_sent',
      data: {
        hasPresetPrompt: false,
        locale: 'en',
      },
    });

    expect(vaMock).toHaveBeenCalledTimes(1);
    expect(vaMock).toHaveBeenCalledWith('event', {
      name: 'copilot_message_sent',
      data: {
        hasPresetPrompt: false,
        locale: 'en',
      },
    });
  });

  it('tracks rebalance approval with tier and passkey boolean', () => {
    const vaMock = vi.fn();
    window.va = vaMock;

    const payload = track(ENGAGEMENT_EVENTS.rebalanceProposalApproved, {
      tier: 'TIER_3_EXECUTE',
      isPasskeyGated: true,
    });

    expect(payload.name).toBe('rebalance_proposal_approved');
    expect(payload.data).toEqual({
      tier: 'TIER_3_EXECUTE',
      isPasskeyGated: true,
    });
    expect(vaMock).toHaveBeenCalledWith('event', payload);
  });

  it('tracks stress simulations with scenario enum and boolean', () => {
    const vaMock = vi.fn();
    window.va = vaMock;

    const payload = track(ENGAGEMENT_EVENTS.stressSimulationRun, {
      scenario: 'EUR_SHOCK_5',
      hasCustomShock: false,
    });

    expect(payload.name).toBe('stress_simulation_run');
    expect(payload.data).toEqual({
      scenario: 'EUR_SHOCK_5',
      hasCustomShock: false,
    });
    expect(vaMock).toHaveBeenCalledWith('event', payload);
  });

  it('tracks share link creation with privacy masking state', () => {
    const vaMock = vi.fn();
    window.va = vaMock;

    const payload = track(ENGAGEMENT_EVENTS.shareLinkCreated, {
      isMasked: true,
      hasExpiry: true,
    });

    expect(payload.name).toBe('share_link_created');
    expect(payload.data).toEqual({
      isMasked: true,
      hasExpiry: true,
    });
    expect(vaMock).toHaveBeenCalledWith('event', payload);
  });

  it('tracks passkey step-up completion with flow enum and success flag', () => {
    const vaMock = vi.fn();
    window.va = vaMock;

    const payload = track(ENGAGEMENT_EVENTS.passkeyStepupCompleted, {
      flow: 'REBALANCE',
      success: true,
    });

    expect(payload.name).toBe('passkey_stepup_completed');
    expect(payload.data).toEqual({
      flow: 'REBALANCE',
      success: true,
    });
    expect(vaMock).toHaveBeenCalledWith('event', payload);
  });

  it('never throws even when window.va throws an exception (fire-and-forget)', () => {
    window.va = vi.fn(() => {
      throw new Error('Network failure or blocked tracking script');
    });

    expect(() =>
      track(ENGAGEMENT_EVENTS.copilotMessageSent, {
        hasPresetPrompt: true,
        locale: 'de',
      }),
    ).not.toThrow();
  });

  it('safely handles missing window.va without errors', () => {
    delete (window as unknown as { va?: unknown }).va;

    expect(() =>
      track(ENGAGEMENT_EVENTS.copilotMessageSent, {
        hasPresetPrompt: true,
        locale: 'zh-CN',
      }),
    ).not.toThrow();
  });
});
