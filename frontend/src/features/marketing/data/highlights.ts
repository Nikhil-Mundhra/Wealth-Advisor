export interface Highlight {
  readonly statement: string;
  readonly title: string;
  readonly detail: string;
}

// Product statements, not customer testimonials: there are no real users to quote yet.
export const HIGHLIGHTS: readonly Highlight[] = [
  {
    statement: 'See every currency you earn and spend in one place, and what each one costs you.',
    title: 'Multi-currency overview',
    detail: 'Income, spending and FX exposure',
  },
  {
    statement: 'Your allocation is rechecked whenever your monthly spending jumps.',
    title: 'Adaptive allocation',
    detail: 'Driven by your real cash flow',
  },
  {
    statement: 'Find the cheapest way and time to move money between your home and host country.',
    title: 'Cheaper transfers',
    detail: 'Remittance cost and timing',
  },
];
