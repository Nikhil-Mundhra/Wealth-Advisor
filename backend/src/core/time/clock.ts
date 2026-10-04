// Time source for anything that compares against "now"; tests inject a controllable clock.
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};
