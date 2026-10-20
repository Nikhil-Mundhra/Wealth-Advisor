import { useState } from 'react';
import { Check, Copy, Link2 } from 'lucide-react';
import { Alert } from '../../../components/ui/alert.tsx';
import { Button } from '../../../components/ui/button.tsx';
import { Dialog } from '../../../components/ui/dialog.tsx';
import { ENGAGEMENT_EVENTS, track } from '../../../lib/engagement.ts';
import { useCreateShareLink } from '../api/use-create-share-link.ts';

interface ShareStrategyModalProps {
  open: boolean;
  onClose: () => void;
  ownerDisplayName: string;
}

// Issues a read-only share URL; the viewer picks privacy masking before the link is created.
export function ShareStrategyModal({ open, onClose, ownerDisplayName }: ShareStrategyModalProps) {
  const [privacyMasked, setPrivacyMasked] = useState(true);
  const [copied, setCopied] = useState(false);
  const createLink = useCreateShareLink();
  const url = createLink.data ? `${window.location.origin}${createLink.data.url}` : null;

  function handleClose() {
    createLink.reset();
    setCopied(false);
    onClose();
  }

  function handleCreate() {
    setCopied(false);
    track(ENGAGEMENT_EVENTS.shareLinkCreated, { isMasked: privacyMasked, hasExpiry: true });
    createLink.mutate({ privacyMasked, ttlHours: 72, ownerDisplayName });
  }

  async function handleCopy() {
    if (!url || typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard unavailable in this browser context; the URL stays selectable.
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Share strategy">
      <p className="mt-2 text-sm text-subtle">
        A read-only link to this allocation proposal for {ownerDisplayName}. The link expires after 72 hours.
      </p>

      <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={privacyMasked}
          onChange={(event) => setPrivacyMasked(event.target.checked)}
          className="mt-1 size-4 accent-brand-600"
        />
        <span>
          <span className="font-medium text-ink">Mask absolute amounts</span>
          <span className="block text-xs text-subtle">Viewers see target percentages, never account valuations.</span>
        </span>
      </label>

      {createLink.isError && (
        <div className="mt-3">
          <Alert>Could not create the share link. Sign in and try again.</Alert>
        </div>
      )}

      {url ? (
        <div className="mt-4 flex flex-col gap-2">
          <label htmlFor="share-strategy-url" className="text-xs font-medium text-subtle">
            Expires {new Date(createLink.data!.expiresAt).toLocaleDateString()}
          </label>
          <div className="flex gap-2">
            <input
              id="share-strategy-url"
              readOnly
              value={url}
              onFocus={(event) => event.target.select()}
              className="min-w-0 flex-1 rounded-field border border-line bg-surface-subtle px-3 py-2 font-mono text-xs text-ink focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
            <Button type="button" variant="outline" onClick={handleCopy} className="gap-1.5">
              {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleCreate} loading={createLink.isPending} className="gap-1.5">
            <Link2 aria-hidden className="size-4" />
            <span>Create link</span>
          </Button>
        </div>
      )}
    </Dialog>
  );
}
