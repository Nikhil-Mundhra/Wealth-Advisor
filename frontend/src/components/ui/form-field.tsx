import { type ReactNode, useId } from 'react';
import { Label } from './label.tsx';

export interface FieldControlProps {
  id: string;
  'aria-invalid': true | undefined;
  'aria-describedby': string | undefined;
}

interface FormFieldProps {
  label: string;
  hint?: string;
  error?: string;
  // Receives the ids that link the control to its label and message; spread them onto the control.
  children: (control: FieldControlProps) => ReactNode;
}

// Label + control + one message. An error replaces the hint, and the control points at whichever is shown.
export function FormField({ label, hint, error, children }: FormFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': message ? messageId : undefined })}
      {message && (
        <p id={messageId} className={error ? 'text-sm text-danger' : 'text-sm text-subtle'}>
          {message}
        </p>
      )}
    </div>
  );
}
