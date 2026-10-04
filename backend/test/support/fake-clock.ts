import type { Clock } from '#core/time/clock.ts';

// A clock the test moves by hand, for expiry and grace-window cases.
export class FakeClock implements Clock {
  private current: Date;

  constructor(start: Date) {
    this.current = start;
  }

  now(): Date {
    return new Date(this.current);
  }

  advanceSeconds(seconds: number): void {
    this.current = new Date(this.current.getTime() + seconds * 1000);
  }
}
