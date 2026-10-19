import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Link as LinkIcon, Send } from 'lucide-react';
import { Button } from '../../../components/ui/button.tsx';
import { Dialog } from '../../../components/ui/dialog.tsx';
import { FormField } from '../../../components/ui/form-field.tsx';
import { Input } from '../../../components/ui/input.tsx';
import { authApi } from '../../auth/api/auth-api.ts';

interface InviteClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteClientModal({ open, onOpenChange }: InviteClientModalProps) {
  const queryClient = useQueryClient();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [note, setNote] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: authApi.createAdvisorInvite,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['advisor', 'invites'] });
      setGeneratedLink(data.inviteUrl);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      clientName: clientName.trim() || null,
      clientEmail: clientEmail.trim() || null,
      note: note.trim() || null,
    });
  };

  const handleCopy = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleClose = () => {
    setClientName('');
    setClientEmail('');
    setNote('');
    setGeneratedLink(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Invite Client to Portal">
      <p className="mt-1 text-xs text-subtle mb-4">
        Generate a secure onboarding delegation link for your client. Once accepted, you will have read-only surveillance of their portfolio.
      </p>

      {generatedLink ? (
        <div className="space-y-4 pt-2">
          <div className="rounded-field bg-emerald-500/10 p-4 border border-emerald-500/20 text-xs">
            <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
              <Check aria-hidden className="size-4" />
              <span>Invitation link created</span>
            </div>
            <p className="mt-1 text-emerald-700 dark:text-emerald-400">
              Send this link to your client. When they register through this link, their account will automatically be connected to your advisory roster.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-field border border-line bg-surface-subtle p-2 text-xs">
            <LinkIcon aria-hidden className="size-4 shrink-0 text-brand-600 dark:text-brand-400" />
            <input
              readOnly
              value={generatedLink}
              className="w-full bg-transparent font-mono text-[11px] text-ink focus:outline-none"
            />
            <Button type="button" variant="outline" className="h-8 px-2.5 text-xs" onClick={handleCopy}>
              {copied ? <Check aria-hidden className="size-3.5" /> : <Copy aria-hidden className="size-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" variant="primary" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <FormField label="Client full name">
            {(control) => (
              <Input
                {...control}
                placeholder="e.g. Marcus Vance"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            )}
          </FormField>
          <FormField label="Client email address (optional)">
            {(control) => (
              <Input
                {...control}
                type="email"
                placeholder="marcus.v@expat.de"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            )}
          </FormField>
          <FormField label="Personal onboarding note (optional)">
            {(control) => (
              <Input
                {...control}
                placeholder="e.g. Cross-border portfolio review & tax allocation"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            )}
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={mutation.isPending}>
              <Send aria-hidden className="mr-1.5 size-3.5" />
              Generate Delegation Link
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
