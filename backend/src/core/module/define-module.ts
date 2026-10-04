import type { EventSubscription } from '#core/events/event-bus.ts';
import type { RouteDefinition } from '#core/http/route-builder.ts';
import type { CollectionDefinition } from '#core/persistence/collection-definition.ts';

// Everything a module contributes to the app, declared in one object.
export interface ModuleManifest {
  readonly name: string;
  readonly basePath: string; // mounted under /api
  readonly routes: readonly RouteDefinition[];
  readonly collections: readonly CollectionDefinition[];
  readonly subscriptions: readonly EventSubscription[];
  // The module's error codes and their HTTP statuses, all under one prefix (see core/errors/error-catalog.ts).
  readonly errors?: { readonly prefix: string; readonly statuses: Readonly<Record<string, number>> };
}

type ModuleInput = Pick<ModuleManifest, 'name' | 'basePath' | 'routes'> &
  Partial<Pick<ModuleManifest, 'collections' | 'subscriptions' | 'errors'>>;

const BASE_PATH = /^\/[a-z0-9-]+$/;

export function defineModule(input: ModuleInput): ModuleManifest {
  if (!BASE_PATH.test(input.basePath)) {
    throw new Error(`module "${input.name}": basePath must look like "/name", got "${input.basePath}"`);
  }
  return Object.freeze({ collections: [], subscriptions: [], ...input });
}
