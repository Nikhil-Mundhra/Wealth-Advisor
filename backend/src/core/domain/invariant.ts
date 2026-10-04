// Throws the given error when a domain invariant does not hold.
export function invariant(condition: boolean, error: () => Error): asserts condition {
  if (!condition) throw error();
}
