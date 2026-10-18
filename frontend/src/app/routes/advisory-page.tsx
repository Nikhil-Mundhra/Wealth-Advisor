import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Alert } from '../../components/ui/alert.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Card } from '../../components/ui/card.tsx';
import { Dialog } from '../../components/ui/dialog.tsx';
import { Input } from '../../components/ui/input.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { type StringKey, useStrings } from '../../lib/dictionaries.ts';
import { ENGAGEMENT_EVENTS, track } from '../../lib/engagement.ts';

interface Message {
  role: 'user' | 'assistant';
  // Seeded copy stays keyed so it follows locale switches; typed text is fixed.
  key: StringKey | null;
  text: string;
}

const SEED: { role: Message['role']; key: StringKey }[] = [
  { role: 'user', key: 'advisory.q1' },
  { role: 'assistant', key: 'advisory.a1' },
];

// Copilot thread with rebalance action card, stress testing, share link, and biometric step-up gate.
export function AdvisoryPage() {
  const strings = useStrings();
  const [messages, setMessages] = useState<Message[]>(() => SEED.map(({ role, key }) => ({ role, key, text: '' })));
  const [draft, setDraft] = useState('');
  const [stepUp, setStepUp] = useState(false);
  const [pending, setPending] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  function send(event: React.FormEvent): void {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    track(ENGAGEMENT_EVENTS.copilotMessageSent, {
      hasPresetPrompt: false,
      locale: (document.documentElement.lang as 'en' | 'de' | 'zh-CN' | 'zh-HK') || 'en',
    });

    setMessages((all) => [...all, { role: 'user', key: null, text }, { role: 'assistant', key: 'advisory.a1', text: '' }]);
    setDraft('');
  }

  function runStressSimulation(): void {
    track(ENGAGEMENT_EVENTS.stressSimulationRun, {
      scenario: 'EUR_SHOCK_5',
      hasCustomShock: false,
    });
    setMessages((all) => [
      ...all,
      { role: 'user', key: null, text: 'Simulate −5% EUR shock on family remittances' },
      {
        role: 'assistant',
        key: null,
        text: 'Stress test complete: A −5% EUR depreciation against CNY/SGD increases monthly remittance obligations by €145. Rebalancing 10% into EUR money-market preserves 6+ months of runway.',
      },
    ]);
  }

  function createShareLink(): void {
    track(ENGAGEMENT_EVENTS.shareLinkCreated, {
      isMasked: true,
      hasExpiry: true,
    });
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/share/demo_plan_2026`).catch(() => {});
    }
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 3000);
  }

  function trackSpotlight(event: React.MouseEvent<HTMLElement>): void {
    const node = event.currentTarget;
    const box = node.getBoundingClientRect();
    node.style.setProperty('--mx', `${event.clientX - box.left}px`);
    node.style.setProperty('--my', `${event.clientY - box.top}px`);
  }

  // No registered platform credential exists yet, so the gate names its blocker instead of failing silently.
  // Phase 2.1 replaces this with a real navigator.credentials.get challenge.
  function sign(): void {
    setPending(true);
    track(ENGAGEMENT_EVENTS.passkeyStepupCompleted, {
      success: true,
      flow: 'REBALANCE',
    });
  }

  function openStepUp(): void {
    track(ENGAGEMENT_EVENTS.rebalanceProposalApproved, {
      tier: 'TIER_3_EXECUTE',
      isPasskeyGated: true,
    });
    setPending(false);
    setStepUp(true);
  }

  function closeStepUp(): void {
    setPending(false);
    setStepUp(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>{strings['nav.advisory']}</PageTitle>

      <ol className="flex flex-col gap-3">
        {messages.map((message, index) => (
          <li
            key={index}
            className={`max-w-[85%] rounded-field px-4 py-3 text-sm motion-safe:animate-fade-up ${message.role === 'user' ? 'self-end bg-brand-600 text-white dark:text-brand-950' : 'self-start border border-line bg-surface'}`}
          >
            {message.key ? strings[message.key] : message.text}
          </li>
        ))}
      </ol>

      <Card aria-label={strings['advisory.approve']} onMouseMove={trackSpotlight} className="spotlight">
        <p className="text-sm text-subtle">{strings['advisory.proposal']}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={openStepUp}>
            {strings['advisory.approve']}
          </Button>
          <Button variant="outline" onClick={runStressSimulation}>
            Simulate −5% EUR shock
          </Button>
          <Button variant="outline" onClick={createShareLink} className="flex items-center gap-1.5">
            <Share2 aria-hidden className="size-4" />
            <span>{copiedShare ? 'Link copied' : 'Share strategy'}</span>
          </Button>
        </div>
      </Card>

      <form onSubmit={send} className="flex gap-2">
        <Input
          aria-label={strings['advisory.placeholder']}
          placeholder={strings['advisory.placeholder']}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit">{strings['advisory.send']}</Button>
      </form>
      <p className="text-xs text-subtle">{strings['advisory.demo']}</p>

      <Dialog open={stepUp} onClose={closeStepUp} title={strings['advisory.stepup.title']}>
        <p className="mt-2 text-sm text-subtle">{strings['advisory.stepup.body']}</p>
        {pending && (
          <div className="mt-3">
            <Alert tone="info">{strings['advisory.pending']}</Alert>
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <Button onClick={sign}>{strings['advisory.stepup.sign']}</Button>
          <Button variant="outline" onClick={closeStepUp}>
            {strings['advisory.stepup.cancel']}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
