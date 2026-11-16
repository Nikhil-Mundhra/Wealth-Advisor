import { useState } from 'react';
import { type DefaultValues, type FieldValues, type Path, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { type ErrorMessageMap } from '../errors/resolve-error.ts';
import { toFieldMessage } from '../validation/validation-messages.ts';
import { applyServerError } from './apply-server-error.ts';

interface ContractFormOptions<S extends z.ZodObject<z.ZodRawShape>> {
  readonly defaultValues: DefaultValues<z.input<S> & FieldValues>;
  readonly messages: ErrorMessageMap<string>;
}

// A form validated by a shared contract: the same schema the API enforces checks it on submit, and server errors
// come back under the right field. Forms compose this hook instead of inheriting from a base form.
export function useContractForm<Shape extends z.ZodRawShape>(
  schema: z.ZodObject<Shape>,
  options: ContractFormOptions<z.ZodObject<Shape>>,
) {
  type Input = z.input<z.ZodObject<Shape>> & FieldValues;
  type Output = z.output<z.ZodObject<Shape>>;
  const form = useForm<Input, unknown, Output>({
    resolver: zodResolver(schema as z.ZodType<Output, Input>),
    defaultValues: options.defaultValues,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const fields = Object.keys(schema.shape);

  const submit = (action: (values: Output) => Promise<void>) =>
    form.handleSubmit(async (values) => {
      setFormError(null);
      try {
        await action(values);
      } catch (error) {
        applyServerError({ form, error, fields, messages: options.messages, setFormError });
      }
    });

  const fieldError = (name: Path<Input>): string | undefined => {
    const rawError: unknown = form.getFieldState(name, form.formState).error;
    const msg =
      typeof rawError === 'object' && rawError !== null && 'message' in rawError && typeof rawError.message === 'string'
        ? rawError.message
        : undefined;
    return toFieldMessage(msg);
  };

  return { form, formError, submit, fieldError };
}
