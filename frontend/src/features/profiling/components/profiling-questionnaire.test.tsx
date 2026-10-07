import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setLocale } from '../../../lib/locale-store.ts';
import { clearDraft, getProfileState, saveDraft, DEFAULT_ELENA_PROFILE, INITIAL_EMPTY_PROFILE } from '../profile-store.ts';
import { ProfilingQuestionnaire } from './profiling-questionnaire.tsx';

describe('ProfilingQuestionnaire', () => {
  beforeEach(() => {
    setLocale('en');
    clearDraft();
    clearDraft('fresh@example.com');
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

  it('defaults question 2 to UAE residence and UAE and India income', () => {
    saveDraft(2, INITIAL_EMPTY_PROFILE, 'fresh@example.com');
    const onComplete = vi.fn();
    render(<ProfilingQuestionnaire onComplete={onComplete} email="fresh@example.com" />);

    expect(screen.getByRole('group', { name: 'Selected Country of residence' })).toHaveTextContent('(AE)');
    expect(screen.getByRole('group', { name: 'Selected Where income is earned' })).toHaveTextContent('India');
  });

  it('renders blank AED and INR sections, with residence currency first, and saves both amounts', async () => {
    saveDraft(4, INITIAL_EMPTY_PROFILE, 'fresh@example.com');
    const onComplete = vi.fn();
    render(<ProfilingQuestionnaire onComplete={onComplete} email="fresh@example.com" />);

    const sections = screen.getAllByRole('group');
    expect(sections[0]).toHaveTextContent('AED');
    expect(sections[1]).toHaveTextContent('INR');
    const aedCash = screen.getByRole('spinbutton', { name: 'Bank accounts and cash (AED)' });
    const inrCash = screen.getByRole('spinbutton', { name: 'Bank accounts and cash (INR)' });
    expect(aedCash).toHaveValue(null);
    expect(inrCash).toHaveValue(null);

    await userEvent.type(aedCash, '1200');
    await userEvent.type(inrCash, '3500');
    expect(aedCash).toHaveValue(1200);
    expect(inrCash).toHaveValue(3500);
    expect(getProfileState('fresh@example.com').draft?.answers.holdingsByCurrency).toMatchObject({
      AED: { cashSavings: 1200 },
      INR: { cashSavings: 3500 },
    });
  });

  it('adds one section per distinct income currency and keeps the residence currency first', () => {
    saveDraft(4, {
      ...INITIAL_EMPTY_PROFILE,
      countries: { residence: 'IN', incomeSources: ['AE', 'GB', 'IN'], remittanceDestinations: [] },
    }, 'fresh@example.com');
    render(<ProfilingQuestionnaire onComplete={vi.fn()} email="fresh@example.com" />);

    expect(screen.getAllByRole('group').map((section) => section.querySelector('legend')?.textContent)).toEqual([
      'INR', 'AED', 'GBP',
    ]);
  });
});
