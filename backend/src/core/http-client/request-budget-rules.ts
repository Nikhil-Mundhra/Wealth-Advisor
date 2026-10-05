// Counter key and argument checks shared by the Mongo and memory budgets, so both count the same month.
export function budgetMonth(now: Date): string {
  return now.toISOString().slice(0, 7);
}

export function assertReservation(count: number, monthlyLimit: number): void {
  if (!Number.isInteger(count) || count < 1) throw new Error(`reserve count must be a positive integer, got ${count}`);
  if (!Number.isInteger(monthlyLimit) || monthlyLimit < 0) {
    throw new Error(`monthly limit must be a non-negative integer, got ${monthlyLimit}`);
  }
}
