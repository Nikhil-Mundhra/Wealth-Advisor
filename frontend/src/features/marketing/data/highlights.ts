export interface Highlight {
  readonly quote: string;
  readonly title: string;
  readonly detail: string;
}

// Product statements, not customer testimonials: there are no real users to quote yet.
export const HIGHLIGHTS: readonly Highlight[] = [
  {
    quote: 'See every currency you earn and spend in one place, and what each one is really costing you.',
    title: 'Multi-currency overview',
    detail: 'Income, spending and FX exposure',
  },
  {
    quote: 'Advice that adapts when your burn rate spikes, not just when you fill in a questionnaire.',
    title: 'Adaptive allocation',
    detail: 'Driven by your real cash flow',
  },
  {
    quote: 'Know the cheapest way and the best moment to move money between your home and host country.',
    title: 'Smarter transfers',
    detail: 'Remittance cost and timing',
  },
];
