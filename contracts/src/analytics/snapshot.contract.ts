import { z } from 'zod';
import { IsoDateField } from '../fields/iso-date.field.ts';

// asOf: the snapshot computed for that data date; omitted → the latest snapshot.
export const SnapshotQuery = z.object({
  asOf: IsoDateField.optional(),
});
export type SnapshotQuery = z.infer<typeof SnapshotQuery>;

// means, volatilities and covariance rows/columns follow the order of `symbols`; all annualized from daily log
// returns. window is the provenance: which price dates fed the numbers and how many return observations.
export const SnapshotResponse = z.object({
  asOf: IsoDateField,
  symbols: z.array(z.string()),
  means: z.array(z.number()),
  volatilities: z.array(z.number().nonnegative()),
  covariance: z.array(z.array(z.number())),
  window: z.object({
    from: IsoDateField,
    to: IsoDateField,
    observations: z.number().int().nonnegative(),
  }),
  computedAt: z.iso.datetime(),
});
export type SnapshotResponse = z.infer<typeof SnapshotResponse>;
