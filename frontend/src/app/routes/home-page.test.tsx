import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { HomePage } from './home-page.tsx';

let client: QueryClient;

describe('HomePage', () => {
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it('renders the core hero, badge, and the triad foundations', () => {
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Hero title & badge
    expect(screen.getByRole('heading', { level: 1, name: /Bridging the gap between raw LLMs and institutional financial execution/i })).toBeVisible();
    expect(screen.getByText(/AI Wealth Architecture/i)).toBeVisible();

    // Triad pillars
    expect(screen.getByRole('heading', { name: /The Triad Architecture Required to Win Market Execution/i })).toBeVisible();
    expect(screen.getByText(/Pillar 1 · Workflow Engine/i)).toBeVisible();
    expect(screen.getByText(/Pillar 2 · Semantic Graph/i)).toBeVisible();
    expect(screen.getByText(/Pillar 3 · MIT Sloan Research/i)).toBeVisible();
  });

  it('interactively toggles scenarios in the neuro-symbolic simulator', async () => {
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Default scenario: Income Shock
    expect(screen.getByText(/Scenario 1: Sudden Income Shock/i)).toBeVisible();
    expect(screen.getByText(/Slashing spending by 70% immediately/i)).toBeVisible();

    // Switch to Scenario 2: Demographic bias
    const scenario2Btn = screen.getByRole('button', { name: /Scenario 2: Vague Query & Demographic Bias/i });
    await userEvent.click(scenario2Btn);

    expect(screen.getByText(/Overly Conservative Stereotyped Allocation/i)).toBeVisible();
    expect(screen.getByText(/Standardized Objective Utility Optimization/i)).toBeVisible();

    // Switch to Scenario 3: Portfolio drift
    const scenario3Btn = screen.getByRole('button', { name: /Scenario 3: Market Rally & Portfolio Drift/i });
    await userEvent.click(scenario3Btn);

    expect(screen.getByText(/Passive Drift Congratulation/i)).toBeVisible();
    expect(screen.getByText(/Automated ±5% Boundary Rebalancing Trigger/i)).toBeVisible();
  });

  it('navigates documentation subtabs and renders the respective images and content', async () => {
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Default documentation subtab is Advisor Lifecycle OS
    const advisorImg = screen.getByAltText(/Advisor and client conducting an institutional wealth review/i);
    expect(advisorImg).toBeVisible();

    // Switch to MIT Sloan Rigor Gap subtab
    const mitTab = screen.getByRole('tab', { name: /MIT Sloan Rigor Gap/i });
    await userEvent.click(mitTab);

    // Image 2: Market shock should now be rendered
    const shockImg = screen.getByAltText(/Late-night trading desk showing a plummeting stock chart/i);
    expect(shockImg).toBeVisible();

    // Switch to Strategic Wedge subtab
    const wedgeTab = screen.getByRole('tab', { name: /Strategic Wedge/i });
    await userEvent.click(wedgeTab);

    expect(screen.getByRole('heading', { name: /B2B2C Advisor Co-Pilot/i })).toBeVisible();
    expect(screen.getByRole('heading', { name: /B2C Direct Wealth Advisor/i })).toBeVisible();
  });

  it('provides a clean Documentation dropdown in the navbar', async () => {
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const docNavBtn = screen.getByRole('button', { name: /Documentation/i });
    expect(docNavBtn).toBeVisible();

    // Click to open dropdown
    await userEvent.click(docNavBtn);
    expect(screen.getByText(/Architecture Specs/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /Advisor Lifecycle OS/i })).toBeVisible();
  });
});
