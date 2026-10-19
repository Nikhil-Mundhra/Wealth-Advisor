export interface Highlight {
  readonly statement: string;
  readonly title: string;
  readonly detail: string;
}

// Timeless philosophical, analytical, and economic principles on wealth, risk, and discipline.
export const HIGHLIGHTS: readonly Highlight[] = [
  {
    statement: 'Wealth consists not in having great possessions, but in having few wants.',
    title: 'Epictetus',
    detail: 'Stoic Philosopher · Discourses',
  },
  {
    statement: 'The individual investor should act consistently as an investor and not as a speculator.',
    title: 'Benjamin Graham',
    detail: 'Dean of Wall Street · The Intelligent Investor',
  },
  {
    statement: 'In the short run, the market is a voting machine, but in the long run, it is a weighing machine.',
    title: 'Benjamin Graham & David Dodd',
    detail: 'Founders of Value Investing · Security Analysis',
  },
  {
    statement: 'Know what you own, and know why you own it.',
    title: 'Peter Lynch',
    detail: 'Vice Chairman of Fidelity Management · One Up On Wall Street',
  },
  {
    statement: 'Risk comes from not knowing what you’re doing.',
    title: 'Warren Buffett',
    detail: 'Chairman & CEO · Berkshire Hathaway',
  },
];

