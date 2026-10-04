interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <header className="space-y-2">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">{title}</h1>
      <p className="text-sm text-subtle">{subtitle}</p>
    </header>
  );
}
