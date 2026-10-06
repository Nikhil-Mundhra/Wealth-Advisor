import { Dialog } from '../../../components/ui/dialog.tsx';
import { useStrings } from '../../../lib/dictionaries.ts';
import { ProfilingQuestionnaire } from './profiling-questionnaire.tsx';

interface ProfilingModalProps {
  open: boolean;
  onClose: () => void;
  email?: string | null;
}

export function ProfilingModal({ open, onClose, email }: ProfilingModalProps) {
  const strings = useStrings();

  return (
    <Dialog open={open} onClose={onClose} title={strings['profiling.title']} className="max-w-lg">
      <div className="mt-4">
        <ProfilingQuestionnaire email={email} onComplete={onClose} onCancel={onClose} />
      </div>
    </Dialog>
  );
}
