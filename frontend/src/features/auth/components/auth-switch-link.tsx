import { TextLink } from '../../../components/ui/text-link.tsx';

interface AuthSwitchLinkProps {
  prompt: string;
  to: string;
  label: string;
}

export function AuthSwitchLink({ prompt, to, label }: AuthSwitchLinkProps) {
  return (
    <p className="text-center text-sm text-subtle">
      {prompt} <TextLink to={to}>{label}</TextLink>
    </p>
  );
}
