import { useEffect, useState } from 'react';

type Health = 'checking' | 'ok' | 'unreachable';

export function App() {
  const [health, setHealth] = useState<Health>('checking');
  const [aiMessage, setAiMessage] = useState('');

  useEffect(() => {
    fetch('/api/health')
      .then((response) => setHealth(response.ok ? 'ok' : 'unreachable'))
      .catch(() => setHealth('unreachable'));
  }, []);

  async function handleAskAi() {
    try {
      const response = await fetch('/api/ai');
      const body: { message?: string } = await response.json();
      setAiMessage(body.message ?? `request failed (${response.status})`);
    } catch {
      setAiMessage('backend unreachable');
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: '0 16px', fontFamily: 'system-ui' }}>
      <h1>Wealth Advisor</h1>
      <p>Backend: {health}</p>
      <button type="button" onClick={handleAskAi}>Ask AI</button>
      {aiMessage && <p>{aiMessage}</p>}
    </main>
  );
}
