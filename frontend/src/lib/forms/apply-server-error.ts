import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { ApiError } from '../api-error.ts';
import { type ErrorMessageMap, resolveError } from '../errors/resolve-error.ts';

interface ApplyServerErrorInput<Values extends FieldValues> {
  readonly form: UseFormReturn<Values, unknown, unknown>;
  readonly error: unknown;
  readonly fields: readonly string[];
  readonly messages: ErrorMessageMap<string>;
  readonly setFormError: (message: string) => void;
}

// Puts a failed submit where the user will look: server field issues under their fields (focus on the first),
// a code tied to a field under that field, everything else in the form-level alert.
export function applyServerError<Values extends FieldValues>({ form, error, fields, messages, setFormError }: ApplyServerErrorInput<Values>): void {
  const fieldIssues = error instanceof ApiError ? error.issues.filter((issue) => fields.includes(issue.path[0] ?? '')) : [];
  if (fieldIssues.length > 0) {
    fieldIssues.forEach((issue, index) => {
      form.setError(issue.path[0] as Path<Values>, { message: issue.code }, { shouldFocus: index === 0 });
    });
    return;
  }
  const view = resolveError(error, messages);
  if (view.field && fields.includes(view.field)) form.setError(view.field as Path<Values>, { message: view.message }, { shouldFocus: true });
  else setFormError(view.message);
}
