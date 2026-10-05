import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { setLocale } from '../../lib/locale-store.ts';
import { AdvisoryPage } from './advisory-page.tsx';

describe('AdvisoryPage', () => {
  it('threads messages, opens the step-up gate, and degrades without platform auth', async () => {
    setLocale('en');
    render(<AdvisoryPage />);

    expect(screen.getByRole('heading', { name: 'Advisory' })).toBeVisible();
    await userEvent.type(screen.getByRole('textbox', { name: 'Ask about your portfolio…' }), 'What about tuition?');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(screen.getByText('What about tuition?')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Approve & simulate' }));
    expect(screen.getByRole('dialog', { name: 'Biometric approval' })).toBeVisible();

    // jsdom has no WebAuthn: the gate must say so instead of failing silently.
    await userEvent.click(screen.getByRole('button', { name: 'Sign & execute' }));
    expect(screen.getByText('Execution needs the backend passkey module (Phase 2.1).')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
