import { useEffect, useRef, useState } from 'react';
import { Alert } from '../../components/ui/alert.tsx';
import { Button } from '../../components/ui/button.tsx';
import { useStrings } from '../../lib/dictionaries.ts';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

// Copilot thread with the rebalance action card and the Tier 3 biometric step-up gate.
export function AdvisoryPage() {
  const strings = useStrings();
  const [messages, setMessages] = useState<Message[]>(() => [
    { role: 'user', text: strings['advisory.q1'] },
    { role: 'assistant', text: strings['advisory.a1'] },
  ]);
  const [draft, setDraft] = useState('');
  const [stepUp, setStepUp] = useState(false);
  const [pending, setPending] = useState(false);
  const dialogTitleRef = useRef<HTMLHeadingElement>(null);

  function send(event: React.FormEvent): void {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    // Demo mode: the canned reply stands in for the Phase 2.5 LLM gateway.
    setMessages((all) => [...all, { role: 'user', text }, { role: 'assistant', text: strings['advisory.a1'] }]);
    setDraft('');
  }

  // No registered platform credential exists yet, so the gate names its blocker instead of failing silently.
  // Phase 2.1 replaces this with a real navigator.credentials.get challenge.
  function sign() {
    setPending(true);
  }

  useEffect(() => {
    if (!stepUp) return;
    dialogTitleRef.current?.focus();
    const close = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setStepUp(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [stepUp]);

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
      <h1 className="text-2xl font-semibold tracking-tight">{strings['nav.advisory']}</h1>

      <ol className="flex flex-col gap-3">
        {messages.map((message, index) => (
          <li
            key={index}
            className={`max-w-[85%] rounded-field px-4 py-3 text-sm ${message.role === 'user' ? 'self-end bg-brand-600 text-white dark:text-brand-950' : 'self-start border border-line bg-surface'}`}
          >
            {message.text}
          </li>
        ))}
      </ol>

      <section aria-label={strings['advisory.approve']} className="rounded-field border border-line bg-surface p-5">
        <p className="text-sm text-subtle">{strings['advisory.proposal']}</p>
        <Button className="mt-3" onClick={openStepUp}>
          {strings['advisory.approve']}
        </Button>
      </section>

      <form onSubmit={send} className="flex gap-2">
        <input
          aria-label={strings['advisory.placeholder']}
          placeholder={strings['advisory.placeholder']}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="h-11 w-full rounded-field border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-subtle focus:border-brand-600 focus:outline-none"
        />
        <Button type="submit">{strings['advisory.send']}</Button>
      </form>
      <p className="text-xs text-subtle">{strings['advisory.demo']}</p>

      {stepUp && (
        <div className="fixed inset-0 z-20 flex items-end justify-center sm:items-center">
          <div aria-hidden="true" className="absolute inset-0 bg-black/50" onClick={closeStepUp} />
          <div role="dialog" aria-modal="true" aria-label={strings['advisory.stepup.title']} className="relative w-full max-w-md rounded-t-field border border-line bg-surface p-6 pb-[env(safe-area-inset-bottom)] sm:rounded-field sm:pb-6">
            <h2 ref={dialogTitleRef} tabIndex={-1} className="text-lg font-semibold">{strings['advisory.stepup.title']}</h2>
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
          </div>
        </div>
      )}
    </div>
  );
}
