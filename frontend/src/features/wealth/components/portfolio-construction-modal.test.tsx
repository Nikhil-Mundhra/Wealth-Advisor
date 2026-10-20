import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConstructPortfolioResponse } from '@wealth-advisor/contracts';
import { formatMoney } from '../../../lib/format-money.ts';
import { wealthApi } from '../api/wealth-api.ts';
import { PortfolioConstructionModal } from './portfolio-construction-modal.tsx';

vi.mock('../api/wealth-api.ts', () => ({ wealthApi: { constructPortfolio: vi.fn() } }));

// One client per test, created outside render so re-renders keep the same cache.
let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

// Chosen so every derived figure below is checkable by hand: 5.5y duration x 200bps = 11.00%,
// 60%/40% weights, and a mix of pass/fail compliance flags and positive/negative stress moves.
const RESPONSE: ConstructPortfolioResponse = {
  riskTier: 'moderate',
  riskAversionLambda: 4.5,
  holdings: [
    {
      symbol: 'VTI',
      name: 'Vanguard Total Stock Market',
      assetClass: 'EQUITY_US',
      sector: 'Broad Market',
      securityType: 'STOCK',
      weight: 0.6,
      targetAmountBase: 5_700_000,
      expectedReturn: 0.085,
      annualVolatility: 0.16,
      compositeScore: 0.81,
      technicalScore: 0.74,
      fundamentalScore: 0.83,
      qualityScore: 0.86,
      isShariaCompliant: false,
    },
    {
      symbol: 'SUKUK',
      name: 'Sovereign Sukuk 2031',
      assetClass: 'SUKUK_SOVEREIGN',
      sector: 'Sovereign',
      securityType: 'BOND',
      weight: 0.4,
      targetAmountBase: 3_800_000,
      expectedReturn: 0.041,
      annualVolatility: 0.05,
      compositeScore: 0.69,
      technicalScore: 0.6,
      fundamentalScore: 0.72,
      qualityScore: 0.75,
      isShariaCompliant: true,
    },
  ],
  portfolioExpectedReturn: 7.4,
  portfolioVolatility: 11.2,
  portfolioSharpeRatio: 0.68,
  durationWeightedExposure: 5.5,
  complianceChecks: {
    shariaPassed: true,
    liquidityPassed: true,
    sectorCapsPassed: true,
    fundHouseCapPassed: false,
    durationCapPassed: true,
  },
  stressTestOutcomes: [
    {
      scenarioName: 'Rate Shock +200bps',
      description: 'Parallel policy shift across the curve',
      portfolioValueChangePct: -12.4,
      estimatedDrawdownPct: -14.1,
      violatesConstraint: true,
    },
    {
      scenarioName: 'Equity Drawdown',
      description: 'Risk-off de-risking wave',
      portfolioValueChangePct: -5,
      estimatedDrawdownPct: -6.2,
      violatesConstraint: false,
    },
    {
      scenarioName: 'Gold Rally',
      description: 'Hedge demand surge',
      portfolioValueChangePct: 3,
      estimatedDrawdownPct: 0.5,
      violatesConstraint: false,
    },
  ],
  monteCarlo: {
    numSimulations: 2000,
    projectionMonths: 12,
    percentiles: { p5: -14.2, p25: -3.1, p50: 6.8, p75: 15.4, p95: 24.9 },
    valueAtRisk95: 18.4,
    cvar95: 21.7,
    maxSimulatedDrawdown: 27.3,
  },
  rationale: {
    personalFinance: 'personal-finance-copy',
    crossBorder: 'cross-border-copy',
    wealthStrategy: 'wealth-strategy-copy',
    technicalAttribution: 'technical-copy',
    fundamentalAttribution: 'fundamental-copy',
    regulatoryAttribution: 'regulatory-copy',
  },
  sourceAttribution: ['Mean-Variance Optimizer', 'DCF Valuation Model'],
};

function renderModal(onClose = vi.fn()) {
  const view = render(<PortfolioConstructionModal open onClose={onClose} />, { wrapper });
  return { ...view, onClose };
}

/** Nearest rounded-field card holding a stress scenario, identified by its scenario name. */
function scenarioCard(name: string) {
  const label = screen.getByText(name);
  return { card: label.closest('.rounded-field') as HTMLElement, pct: label.parentElement!.querySelector('.font-mono') as HTMLElement };
}

/** Compliance row icon, located through the row heading rather than a class string. */
function complianceIcon(heading: string) {
  return screen.getByText(heading).closest('.flex.items-start')!.querySelector('svg')!;
}

describe('PortfolioConstructionModal', () => {
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    vi.mocked(wealthApi.constructPortfolio).mockReset();
    vi.mocked(wealthApi.constructPortfolio).mockResolvedValue(RESPONSE);
  });

  it('renders nothing and solves nothing while closed', () => {
    render(<PortfolioConstructionModal open={false} onClose={vi.fn()} />, { wrapper });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(wealthApi.constructPortfolio).not.toHaveBeenCalled();
  });

  it('exposes the dialog semantics used by screen readers', async () => {
    renderModal();
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'portfolio-construction-title');
    expect(screen.getByRole('heading', { name: 'Fiduciary Portfolio Construction: Elena Vance' })).toBeInTheDocument();
  });

  it('solves once on open with minor-unit value and the default controls', async () => {
    renderModal();
    await vi.waitFor(() =>
      expect(wealthApi.constructPortfolio).toHaveBeenCalledWith({
        riskTier: 'moderate',
        jurisdiction: 'GLOBAL',
        shariaOnly: false,
        targetTotalValueBase: 9_500_000,
      }),
    );
  });

  it('re-solves when the risk tier and jurisdiction change', async () => {
    renderModal();
    await vi.waitFor(() => expect(wealthApi.constructPortfolio).toHaveBeenCalledTimes(1));

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'conservative' } });
    await vi.waitFor(() =>
      expect(wealthApi.constructPortfolio).toHaveBeenLastCalledWith(
        expect.objectContaining({ riskTier: 'conservative', jurisdiction: 'GLOBAL' }),
      ),
    );

    fireEvent.change(selects[1], { target: { value: 'INDIA' } });
    await vi.waitFor(() =>
      expect(wealthApi.constructPortfolio).toHaveBeenLastCalledWith(
        expect.objectContaining({ riskTier: 'conservative', jurisdiction: 'INDIA' }),
      ),
    );
  });

  it('sends the same payload from the Re-Solve button as from the open effect', async () => {
    renderModal();
    await vi.waitFor(() => expect(wealthApi.constructPortfolio).toHaveBeenCalledTimes(1));
    const fromEffect = vi.mocked(wealthApi.constructPortfolio).mock.calls[0][0];

    vi.mocked(wealthApi.constructPortfolio).mockClear();
    await userEvent.click(screen.getByRole('button', { name: 'Re-Solve Optimal Portfolio' }));

    expect(wealthApi.constructPortfolio).toHaveBeenCalledTimes(1);
    expect(wealthApi.constructPortfolio).toHaveBeenCalledWith(fromEffect);
  });

  it('disables Re-Solve and relabels it while a solve is in flight', async () => {
    let resolveSolve!: (value: ConstructPortfolioResponse) => void;
    vi.mocked(wealthApi.constructPortfolio).mockImplementation(
      () => new Promise((resolve) => { resolveSolve = resolve; }),
    );
    renderModal();

    expect(await screen.findByRole('button', { name: 'Solving Optimization...' })).toBeDisabled();

    resolveSolve(RESPONSE);
    expect(await screen.findByRole('button', { name: 'Re-Solve Optimal Portfolio' })).toBeEnabled();
  });

  it('renders the five summary metrics from the response', async () => {
    renderModal();
    expect(await screen.findByText('+7.4%')).toBeInTheDocument();
    expect(screen.getByText('11.2%')).toBeInTheDocument();
    expect(screen.getByText('0.68')).toBeInTheDocument();
    expect(screen.getByText('5.5 yrs')).toBeInTheDocument();
    expect(screen.getByText('-18.4%')).toBeInTheDocument();
  });

  it('opens on the allocation tab and swaps panels when a tab is picked', async () => {
    renderModal();
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.queryByText('personal-finance-copy')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Fiduciary Rationale (6 Pillars)' }));
    expect(await screen.findByText('personal-finance-copy')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Stress Tests & What-If Calculator' }));
    expect(await screen.findByText('Macroeconomic Scenario Stress Tests')).toBeInTheDocument();
    expect(screen.queryByText('personal-finance-copy')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Regulatory Compliance Checklist' }));
    expect(await screen.findByText('Fiduciary & Jurisdiction Rule Verification Matrix')).toBeInTheDocument();
  });

  it('renders one allocation row per holding with converted units and scores', async () => {
    renderModal();
    expect(await screen.findByRole('table')).toBeInTheDocument();
    const grid = within(screen.getByRole('table'));

    expect(grid.getAllByRole('row')).toHaveLength(3); // header + 2 holdings
    expect(screen.getByText('VTI')).toBeInTheDocument();
    expect(screen.getByText('SUKUK')).toBeInTheDocument();

    // Weights are 0..1 and rendered as percentages to one decimal.
    expect(screen.getByText('60.0%')).toBeInTheDocument();
    expect(screen.getByText('40.0%')).toBeInTheDocument();

    // targetAmountBase is in minor units, so it is divided by 100 before formatting.
    expect(screen.getByText(formatMoney(57_000, 'EUR'))).toBeInTheDocument();
    expect(screen.queryByText(formatMoney(5_700_000, 'EUR'))).not.toBeInTheDocument();

    expect(screen.getByText('+8.5%')).toBeInTheDocument();
    expect(screen.getByText('16.0%')).toBeInTheDocument();

    // Scores and badges repeat per row, so they are read within their own row.
    const equity = within(screen.getByText('VTI').closest('tr')!);
    expect(equity.getByTitle('Technical Score')).toHaveTextContent('0.74');
    expect(equity.getByTitle('Fundamental Valuation Score')).toHaveTextContent('0.83');
    expect(equity.getByTitle('Quality & Liquidity Score')).toHaveTextContent('0.86');
    expect(equity.getByText('0.81')).toBeInTheDocument();
    expect(equity.getByText('Conventional')).toBeInTheDocument();

    const sukuk = within(screen.getByText('SUKUK').closest('tr')!);
    expect(sukuk.getByTitle('Technical Score')).toHaveTextContent('0.6');
    expect(sukuk.getByText('0.69')).toBeInTheDocument();
    expect(sukuk.getByText('Sharia Certified')).toBeInTheDocument();
  });

  it('renders all six rationale pillars and the source attributions', async () => {
    renderModal();
    expect(await screen.findByRole('table')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Fiduciary Rationale (6 Pillars)' }));

    for (const copy of [
      'personal-finance-copy',
      'cross-border-copy',
      'wealth-strategy-copy',
      'technical-copy',
      'fundamental-copy',
      'regulatory-copy',
    ]) {
      expect(await screen.findByText(copy)).toBeInTheDocument();
    }
    expect(screen.getByText('Mean-Variance Optimizer')).toBeInTheDocument();
    expect(screen.getByText('DCF Valuation Model')).toBeInTheDocument();
  });

  it('derives the bond sleeve shift from duration and the rate slider', async () => {
    renderModal();
    expect(await screen.findByRole('table')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Stress Tests & What-If Calculator' }));
    const slider = await screen.findByRole('slider');

    // duration 5.5y: -(5.5 * bps/10000) * 100
    expect(screen.getByText('+0.00%')).toBeInTheDocument();

    fireEvent.change(slider, { target: { value: '-200' } });
    expect(await screen.findByText('+11.00%')).toBeInTheDocument();
    expect(slider).toHaveValue('-200');

    fireEvent.change(slider, { target: { value: '200' } });
    expect(await screen.findByText('-11.00%')).toBeInTheDocument();
    expect(slider).toHaveValue('200');
  });

  it('signs positive stress moves and colours the -10% danger threshold', async () => {
    renderModal();
    expect(await screen.findByRole('table')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Stress Tests & What-If Calculator' }));
    expect(await screen.findByText('Macroeconomic Scenario Stress Tests')).toBeInTheDocument();

    const severe = scenarioCard('Rate Shock +200bps');
    expect(severe.pct).toHaveTextContent('-12.4%');
    expect(severe.pct).toHaveClass('text-danger');
    expect(severe.card).toHaveClass('border-danger/30', 'bg-danger/5');

    const mild = scenarioCard('Equity Drawdown');
    expect(mild.pct).toHaveTextContent('-5%');
    expect(mild.pct).toHaveClass('text-gold');
    expect(mild.card).toHaveClass('border-line');

    const gain = scenarioCard('Gold Rally');
    expect(gain.pct).toHaveTextContent('+3%');
    expect(gain.pct).toHaveClass('text-emerald-600');
  });

  it('renders every Monte Carlo percentile and the tail risk figures', async () => {
    renderModal();
    expect(await screen.findByRole('table')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Stress Tests & What-If Calculator' }));

    for (const value of ['-14.2%', '-3.1%', '+6.8%', '+15.4%', '+24.9%', '21.7%', '27.3%']) {
      expect(await screen.findByText(value)).toBeInTheDocument();
    }
  });

  it('marks each compliance check from its own flag', async () => {
    renderModal();
    expect(await screen.findByRole('table')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Regulatory Compliance Checklist' }));
    expect(await screen.findByText('SCA / AAOIFI Sharia Compliance')).toBeInTheDocument();

    expect(complianceIcon('SCA / AAOIFI Sharia Compliance')).toHaveClass('text-emerald-600');
    expect(complianceIcon('Minimum Liquidity Factor (≥ 0.70)')).toHaveClass('text-emerald-600');
    expect(complianceIcon('Fund House Concentration Cap (≤ 15%)')).toHaveClass('text-danger');
    expect(complianceIcon('Single Sector Exposure Limit (≤ 30%)')).toHaveClass('text-emerald-600');
  });

  it('flips the Sharia filter, its compliance copy, and the next solve payload', async () => {
    renderModal();
    expect(await screen.findByRole('table')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Regulatory Compliance Checklist' }));
    expect(
      await screen.findByText('Dual-jurisdiction portfolio contains compliant sovereign sukuk alongside conventional diversification assets.'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'All Asset Types (Conventional & Sukuk)' }));

    expect(
      await screen.findByText(
        'Strict filter verified: All portfolio holdings are certified Sharia-compliant sukuk or non-financial equities with compliant debt ratios.',
      ),
    ).toBeInTheDocument();
    await vi.waitFor(() => expect(wealthApi.constructPortfolio).toHaveBeenLastCalledWith(expect.objectContaining({ shariaOnly: true })));
  });

  it('closes from the header, footer, and backdrop controls', async () => {
    const { onClose } = renderModal();
    await screen.findByRole('dialog');

    await userEvent.click(screen.getByRole('button', { name: 'Close modal' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
