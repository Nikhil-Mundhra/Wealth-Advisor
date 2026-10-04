import { Hono } from 'hono';
import { ErrorCatalog } from '#core/errors/error-catalog.ts';
import type { EventBus } from '#core/events/event-bus.ts';
import { mountRoutes } from '#core/http/route-builder.ts';
import type { ModuleManifest } from '#core/module/define-module.ts';
import type { CollectionDefinition } from '#core/persistence/collection-definition.ts';

// Collects module manifests and applies them: routes onto the API router, subscriptions onto the event bus.
export class ModuleRegistry {
  private readonly modules = new Map<string, ModuleManifest>();

  register(manifest: ModuleManifest): this {
    if (this.modules.has(manifest.name)) throw new Error(`module "${manifest.name}" is registered twice`);
    const clash = [...this.modules.values()].find((existing) => existing.basePath === manifest.basePath);
    if (clash) throw new Error(`modules "${clash.name}" and "${manifest.name}" share basePath ${manifest.basePath}`);
    this.modules.set(manifest.name, manifest);
    return this;
  }

  mount(api: Hono): void {
    for (const manifest of this.modules.values()) {
      const router = new Hono();
      mountRoutes(router, manifest.routes);
      api.route(manifest.basePath, router);
    }
  }

  subscribe(bus: EventBus): void {
    for (const manifest of this.modules.values()) {
      for (const subscription of manifest.subscriptions) bus.subscribe(subscription.eventName, subscription.handler);
    }
  }

  errorCatalog(): ErrorCatalog {
    const catalog = new ErrorCatalog();
    for (const manifest of this.modules.values()) {
      if (manifest.errors) catalog.register(manifest.errors.prefix, manifest.errors.statuses);
    }
    return catalog;
  }

  collections(): CollectionDefinition[] {
    return [...this.modules.values()].flatMap((manifest) => [...manifest.collections]);
  }
}
