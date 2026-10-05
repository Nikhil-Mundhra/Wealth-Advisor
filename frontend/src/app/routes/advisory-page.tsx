import { useEffect, useRef, useState } from 'react';
import { Alert } from '../../components/ui/alert.tsx';
import { Button } from '../../components/ui/button.tsx';
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
  const dialogTitleRef = useRef<HTMLHeadingElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const approveButtonRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (!stepUp) return;
    dialogTitleRef.current?.focus();
    // Tab cycles inside the dialog; Escape and close return focus to Approve.
    const guard = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        closeStepUp();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', guard);
    return () => window.removeEventListener('keydown', guard);
  }, [stepUp]);

  function openStepUp(): void {
    setPending(false);
    setStepUp(true);
  }

  function closeStepUp(): void {
    setPending(false);
    setStepUp(false);
    approveButtonRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{strings['nav.advisory']}</h1>

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

      <section aria-label={strings['advisory.approve']} onMouseMove={trackSpotlight} className="spotlight rounded-field border border-line bg-surface p-5">
        <p className="text-sm text-subtle">{strings['advisory.proposal']}</p>
        <Button ref={approveButtonRef} className="mt-3" onClick={openStepUp}>
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
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={strings['advisory.stepup.title']} className="relative w-full max-w-md rounded-t-field border border-line bg-surface p-6 pb-[env(safe-area-inset-bottom)] sm:rounded-field sm:pb-6">
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
