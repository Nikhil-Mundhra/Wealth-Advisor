import { useNavigate } from 'react-router';
import logoImg from '../../assets/logo.png';
import logoDarkImg from '../../assets/logo-dark.png';
import { LanguageSelect } from '../../components/ui/language-select.tsx';
import { ThemeToggle } from '../../components/ui/theme-toggle.tsx';
import { useMe } from '../../features/auth/api/use-me.ts';
import { ProfilingQuestionnaire } from '../../features/profiling/components/profiling-questionnaire.tsx';
import { useStrings } from '../../lib/dictionaries.ts';

// Dedicated onboarding wizard for newly registered users immediately after sign-up.
export function OnboardingPage() {
  const navigate = useNavigate();
  const strings = useStrings();
  const { data: me } = useMe();

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="relative flex size-8 shrink-0 items-center justify-center">
              <img
                src={logoImg}
                alt="Syntropy AI Logo"
                className="size-8 object-contain dark:hidden"
              />
              <img
                src={logoDarkImg}
                alt="Syntropy AI Logo"
                className="hidden size-8 object-contain dark:block"
              />
            </div>
            <p className="text-lg font-semibold tracking-tight">{strings['app.name']}</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelect />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-8 md:py-12">
        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight">{strings['onboarding.title']}</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-subtle">{strings['onboarding.subtitle']}</p>
        </div>

        <div className="rounded-field border border-line bg-surface p-6 shadow-sm">
          <ProfilingQuestionnaire
            email={me?.email}
            startFresh
            onComplete={() => navigate('/', { replace: true })}
          />
        </div>
      </main>
    </div>
  );
}
