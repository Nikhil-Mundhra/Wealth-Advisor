import { PortfolioSection } from './portfolio-section.tsx';

// Every target class renders for demo account; real accounts render user-configured assets from onboarding.
export function PortfolioPage() {
  return <PortfolioSection showTitle={true} />;
}
