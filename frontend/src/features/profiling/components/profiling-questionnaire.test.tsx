import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setLocale } from '../../../lib/locale-store.ts';
import { clearDraft, saveDraft, DEFAULT_ELENA_PROFILE } from '../profile-store.ts';
import { ProfilingQuestionnaire } from './profiling-questionnaire.tsx';

describe('ProfilingQuestionnaire', () => {
  beforeEach(() => {
    setLocale('en');
    clearDraft();
  });

  it('renders step 1 with humanized question and advances to step 2', async () => {
    const onComplete = vi.fn();
    render(<ProfilingQuestionnaire onComplete={onComplete} />);

    expect(screen.getByText('Question 1 of 7')).toBeVisible();
    expect(screen.getByText('How do you feel about investment risk?')).toBeVisible();

    const nextButton = screen.getByRole('button', { name: 'Next' });
    await userEvent.click(nextButton);

    expect(screen.getByText('Question 2 of 7')).toBeVisible();
    expect(screen.getByText('Where do you live, earn, and send money?')).toBeVisible();
  });

  it('resumes from saved draft step', () => {
    saveDraft(3, DEFAULT_ELENA_PROFILE);
    const onComplete = vi.fn();
    render(<ProfilingQuestionnaire onComplete={onComplete} />);

    expect(screen.getByText('Question 3 of 7')).toBeVisible();
    expect(screen.getByText('Resumed draft')).toBeVisible();
    expect(screen.getByText('What types of investments do you want to hold?')).toBeVisible();
  });

  it('completes the full flow from step 7 and calls onComplete', async () => {
    saveDraft(7, DEFAULT_ELENA_PROFILE);
    const onComplete = vi.fn();
    render(<ProfilingQuestionnaire onComplete={onComplete} />);

    expect(screen.getByText('Question 7 of 7')).toBeVisible();
    expect(screen.getByText('If your portfolio dropped 25% over a year, what would you do?')).toBeVisible();

    const saveButton = screen.getByRole('button', { name: 'Save profile' });
    await userEvent.click(saveButton);

    expect(onComplete).toHaveBeenCalled();
  });

  it('renders step 2 with tag inputs and advances with valid residence', async () => {
    saveDraft(2, DEFAULT_ELENA_PROFILE);
    const onComplete = vi.fn();
    render(<ProfilingQuestionnaire onComplete={onComplete} />);

    expect(screen.getByText('Where do you live, earn, and send money?')).toBeVisible();
    expect(screen.getAllByText('(DE)')[0]).toBeVisible();

    const nextButton = screen.getByRole('button', { name: 'Next' });
    await userEvent.click(nextButton);

    expect(screen.getByText('Question 3 of 7')).toBeVisible();
  });

  it('renders step 4 with prioritized currencies banner and allows currency change', async () => {
    saveDraft(4, DEFAULT_ELENA_PROFILE);
    const onComplete = vi.fn();
    render(<ProfilingQuestionnaire onComplete={onComplete} />);

    expect(screen.getByText('Corridor Currencies Prioritized')).toBeVisible();
    const cashCurrencySelect = screen.getByLabelText('Bank accounts and cash currency');
    expect(cashCurrencySelect).toBeVisible();
    expect(cashCurrencySelect).toHaveValue('EUR');

    await userEvent.selectOptions(cashCurrencySelect, 'GBP');
    expect(cashCurrencySelect).toHaveValue('GBP');
  });
});
