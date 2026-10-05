import type { Document } from 'mongodb';

export interface TimestampedDocument extends Document {
  createdAt: Date;
  updatedAt: Date;
}

export type InsertHook = (document: TimestampedDocument, now: Date) => void;
export type UpdateHook = (set: Record<string, unknown>, now: Date) => void;

export interface HookSet {
  insert: InsertHook[];
  update: UpdateHook[];
}

// Hooks are registered per class and inherited down the class chain: base classes run first, then each
// subclass. Keying by constructor keeps one repository's hooks from leaking into a sibling, which a single
// shared static array would do.
const hookRegistry = new WeakMap<object, HookSet>();

export function hooksOf(owner: object): HookSet {
  let hooks = hookRegistry.get(owner);
  if (!hooks) {
    hooks = { insert: [], update: [] };
    hookRegistry.set(owner, hooks);
  }
  return hooks;
}

export function resolveHooks(constructor: object): HookSet {
  const chain: object[] = [];
  for (let owner: object | null = constructor; owner && owner !== Function.prototype; owner = Object.getPrototypeOf(owner)) {
    chain.unshift(owner);
  }
  const resolved: HookSet = { insert: [], update: [] };
  for (const owner of chain) {
    const hooks = hookRegistry.get(owner);
    if (!hooks) continue;
    resolved.insert.push(...hooks.insert);
    resolved.update.push(...hooks.update);
  }
  return resolved;
}
