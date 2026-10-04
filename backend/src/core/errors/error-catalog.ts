// The single place that decides which HTTP status a DomainError code maps to. Each module registers its own codes
// under its own prefix; a code outside the prefix or registered twice stops the app at startup.
export class ErrorCatalog {
  private readonly statuses = new Map<string, number>();
  private readonly prefixes = new Set<string>();

  register(prefix: string, statuses: Readonly<Record<string, number>>): this {
    if (this.prefixes.has(prefix)) throw new Error(`error prefix ${prefix} is registered twice`);
    this.prefixes.add(prefix);
    for (const [code, status] of Object.entries(statuses)) {
      if (!code.startsWith(`${prefix}_`)) throw new Error(`error code ${code} is outside prefix ${prefix}`);
      if (this.statuses.has(code)) throw new Error(`error code ${code} is registered twice`);
      this.statuses.set(code, status);
    }
    return this;
  }

  // Unregistered codes are server bugs, so they surface as 500.
  statusOf(code: string): number {
    return this.statuses.get(code) ?? 500;
  }
}
