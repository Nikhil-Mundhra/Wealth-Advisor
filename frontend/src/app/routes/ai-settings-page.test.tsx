import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetToDefault } from '../../features/ai-config/ai-settings-store.ts';
import { setLocale } from '../../lib/locale-store.ts';
import { AiSettingsPage } from './ai-settings-page.tsx';

describe('AiSettingsPage', () => {
  beforeEach(() => {
    resetToDefault();
    setLocale('en');
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders default platform gateway and FinanceBench ranked models', () => {
    render(
      <MemoryRouter>
        <AiSettingsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'AI & Model Configuration' })).toBeVisible();
    expect(screen.getByText('Platform Default Gateway Active')).toBeVisible();

    // Verify Active Reasoning Model defaults to Nemotron
    expect(screen.getByText('Active Reasoning Model')).toBeVisible();
    expect(screen.getAllByText('NVIDIA Nemotron 3 Ultra 550B').length).toBeGreaterThan(0);
    expect(screen.getAllByText('nvidia/nemotron-3-ultra-550b-a55b:free').length).toBeGreaterThan(0);

    // Verify NVIDIA Nemotron #1 Free spotlight and models grid
    expect(screen.getByText(/is the #1 Free Model/i)).toBeVisible();
    expect(screen.getAllByText('88.5%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Google Gemini 2.5 Flash').length).toBeGreaterThan(0);
  });

  it('submits a custom OpenRouter key, displays toast overlay, and persists in the UI permanently', async () => {
    const user = userEvent.setup();

    const { unmount } = render(
      <MemoryRouter>
        <AiSettingsPage />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(/Paste API key/i);
    await user.type(input, 'sk-or-v1-abcdef1234567890xyz');

    // Click on Nemotron model card
    const nemotronHeading = screen.getByRole('heading', { name: 'NVIDIA Nemotron 3 Ultra 550B' });
    await user.click(nemotronHeading);

    // Save configuration
    const saveBtn = screen.getByRole('button', { name: 'Save & Connect' });
    await user.click(saveBtn);

    // Verify toast notification appears
    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.getByText('AI Gateway Connected')).toBeVisible();

    // Verify UI displays active custom gateway permanently
    expect(screen.getByText('Active Custom Gateway')).toBeVisible();
    expect(screen.getByText(/Verified Active Configuration/i)).toBeVisible();
    expect(screen.getByText(/sk-or-v1-••••••••0xyz/)).toBeVisible();

    // Unmount and remount: form must NOT look empty!
    unmount();
    render(
      <MemoryRouter>
        <AiSettingsPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Active Custom Gateway')).toBeVisible();
    expect(screen.getAllByText('NVIDIA Nemotron 3 Ultra 550B').length).toBeGreaterThan(0);
  });

  it('supports switching between TypeScript and Python developer architecture code snippets', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AiSettingsPage />
      </MemoryRouter>,
    );

    expect(screen.getAllByText(/npm install ai @ai-sdk\/openai/i).length).toBeGreaterThan(0);

    const pythonTab = screen.getByRole('button', { name: 'Python (LiteLLM + Pydantic)' });
    await user.click(pythonTab);

    expect(screen.getAllByText(/brew install uv && uv add litellm pydantic/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/from litellm import completion/i).length).toBeGreaterThan(0);
  });

  it('resets to platform default upon clicking reset button', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AiSettingsPage />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(/Paste API key/i);
    await user.type(input, 'sk-or-v1-testkey123456');

    const saveBtn = screen.getByRole('button', { name: 'Save & Connect' });
    await user.click(saveBtn);

    expect(screen.getByText('Active Custom Gateway')).toBeVisible();

    const resetBtn = screen.getByRole('button', { name: 'Reset to Platform Default' });
    await user.click(resetBtn);

    expect(screen.getByText('Platform Default Gateway Active')).toBeVisible();
  });
});
