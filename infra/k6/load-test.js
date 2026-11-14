import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '15s', target: 10 },
    { duration: '25s', target: 50 },
    { duration: '25s', target: 150 },
    { duration: '25s', target: 300 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<250', 'p(99)<400'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:3000';

export default function () {
  const health = http.get(`${BASE_URL}/api/health`);
  check(health, { 'health 200': (r) => r.status === 200 });

  const cashflow = http.get(`${BASE_URL}/api/finance/cashflow?householdMode=FAMILY_HOUSEHOLD`);
  check(cashflow, { 'cashflow 200': (r) => r.status === 200 });

  const portfolio = http.get(`${BASE_URL}/api/wealth/portfolio`);
  check(portfolio, { 'portfolio 200': (r) => r.status === 200 });

  const advisory = http.post(
    `${BASE_URL}/api/advisory/chat`,
    JSON.stringify({
      message: 'Summarize my runway and target allocation.',
      locale: 'en',
      householdMode: 'FAMILY_HOUSEHOLD',
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(advisory, { 'advisory 200': (r) => r.status === 200 });

  sleep(0.1);
}
