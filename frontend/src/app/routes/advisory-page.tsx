import { useState } from 'react';
import { Alert } from '../../components/ui/alert.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Card } from '../../components/ui/card.tsx';
import { Dialog } from '../../components/ui/dialog.tsx';
import { Input } from '../../components/ui/input.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { type StringKey, useStrings } from '../../lib/dictionaries.ts';

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

// Copilot thread with the rebalance action card and the Tier 3 biometric step-up gate.
export function AdvisoryPage() {
  const strings = useStrings();
  const [messages, setMessages] = useState<Message[]>(() => SEED.map(({ role, key }) => ({ role, key, text: '' })));
  const [draft, setDraft] = useState('');
  const [stepUp, setStepUp] = useState(false);
  const [pending, setPending] = useState(false);

  function send(event: React.FormEvent): void {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    // Demo mode: the canned reply stands in for the Phase 2.5 LLM gateway.
    setMessages((all) => [...all, { role: 'user', key: null, text }, { role: 'assistant', key: 'advisory.a1', text: '' }]);
    setDraft('');
  }

  function trackSpotlight(event: React.MouseEvent<HTMLElement>): void {
    const node = event.currentTarget;
    const box = node.getBoundingClientRect();
    node.style.setProperty('--mx', `${event.clientX - box.left}px`);
    node.style.setProperty('--my', `${event.clientY - box.top}px`);
  }

  // No registered platform credential exists yet, so the gate names its blocker instead of failing silently.
  // Phase 2.1 replaces this with a real navigator.credentials.get challenge.
  function sign() {
    setPending(true);
  }


  function openStepUp(): void {
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
        <Button className="mt-3" onClick={openStepUp}>
          {strings['advisory.approve']}
        </Button>
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
