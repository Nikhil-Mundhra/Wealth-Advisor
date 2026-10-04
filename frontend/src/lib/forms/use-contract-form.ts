import { useState } from 'react';
import { type DefaultValues, type FieldValues, type Path, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { type ErrorMessageMap } from '../errors/resolve-error.ts';
import { toFieldMessage } from '../validation/validation-messages.ts';
import { applyServerError } from './apply-server-error.ts';

type ObjectContract = z.ZodObject<z.ZodRawShape>;

interface ContractFormOptions<S extends ObjectContract> {
  readonly defaultValues: DefaultValues<z.input<S>>;
  readonly messages: ErrorMessageMap<string>;
}

// A form validated by a shared contract: the same schema the API enforces checks it on submit, and server errors
// come back under the right field. Forms compose this hook instead of inheriting from a base form.
export function useContractForm<S extends ObjectContract>(schema: S, options: ContractFormOptions<S>) {
  type Input = z.input<S> & FieldValues;
  type Output = z.output<S>;
  const form = useForm<Input, unknown, Output>({
    resolver: zodResolver(schema as unknown as z.ZodType<Output, Input>),
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
        applyServerError({ form: form as never, error, fields, messages: options.messages, setFormError });
      }
    });

  const fieldError = (name: Path<Input>): string | undefined =>
    toFieldMessage(form.getFieldState(name, form.formState).error?.message);

  return { form, formError, submit, fieldError };
}
