import { SnapshotQuery, SnapshotResponse } from '@wealth-advisor/contracts';
import { RouteBuilder, type RouteDefinition } from '#core/http/route-builder.ts';
import type { AnalyticsApi } from '../../analytics.api.ts';
import { toSnapshotResponse } from '../mappers/result-to-contract.mapper.ts';

// The snapshot is derived from public market data, so it is public like the quotes it comes from.
export function analyticsRoutes(api: AnalyticsApi): RouteDefinition[] {
  return [
    RouteBuilder.get('/snapshot')
      .query(SnapshotQuery)
      .responds(SnapshotResponse)
      .handle(async ({ query }) => toSnapshotResponse(query.asOf ? await api.snapshotAt(query.asOf) : await api.latestSnapshot())),
  ];
}
