// Narrows a stored string to one of a const list, or throws: stored data outside the list is corruption.
export function parseMember<T extends string>(list: readonly T[], value: string, error: () => Error): T {
  if (!(list as readonly string[]).includes(value)) throw error();
  return value as T;
}
