#!/usr/bin/env node
/**
 * Model Context Protocol (MCP) Server: Client Advisory Gateway
 *
 * Implements standard MCP (JSON-RPC 2.0 stdio) allowing an AI client or assistant
 * to authenticate with client credentials and interact with the Wealth Advisor AI pipeline.
 */

import { createHash } from 'node:crypto';
import readline from 'node:readline';

const DEFAULT_BASE_URL = process.env.ADVISORY_URL || 'https://wealth-advisor-ai.vercel.app';
const DEFAULT_EMAIL = process.env.CLIENT_EMAIL || 'testing@example.com';
const DEFAULT_PASSWORD = process.env.CLIENT_PASSWORD || 'testing';

// Token cache keyed by normalized URL, email, and credential hash with JWT expiration tracking.
const tokenCache = new Map();

function jwtExpirationSec(token) {
  try {
    const part = token.split('.')[1];
    if (!part) return 0;
    const payload = JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
    return typeof payload?.exp === 'number' ? payload.exp : 0;
  } catch {
    return 0;
  }
}

function cacheKey(baseUrl, email, password) {
  const passwordHash = createHash('sha256').update(String(password ?? '')).digest('hex');
  return `${baseUrl}|${email}|${passwordHash}`;
}

async function authenticateClient(email, password, baseUrl) {
  const cleanUrl = baseUrl.replace(/\/+$/, '');
  const key = cacheKey(cleanUrl, email, password);
  const entry = tokenCache.get(key);
  const nowSec = Math.floor(Date.now() / 1000);
  if (entry && (entry.exp === 0 || entry.exp - 30 > nowSec)) {
    return entry.token;
  }

  const res = await fetch(`${cleanUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).catch((err) => {
    throw new Error(`Failed to reach auth service at ${cleanUrl}: ${err.message}`);
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json().catch(() => ({}));
  if (data?.accessToken) {
    tokenCache.set(key, {
      token: data.accessToken,
      exp: jwtExpirationSec(data.accessToken),
    });
    return data.accessToken;
  }

  return null;
}

async function sendAdvisoryChat({
  message,
  email,
  password,
  token,
  householdMode = 'INDIVIDUAL',
  locale = 'en',
  url = DEFAULT_BASE_URL,
}) {
  const cleanUrl = url.replace(/\/+$/, '');
  let activeToken = token;

  if (!activeToken && email && password) {
    try {
      activeToken = await authenticateClient(email, password, cleanUrl);
    } catch {
      // Optional auth fallback when credentials cannot reach login endpoint
    }
  }

  const headers = {
    'content-type': 'application/json',
  };
  if (activeToken) {
    headers.authorization = `Bearer ${activeToken}`;
  }

  const chatUrl = `${cleanUrl}/api/advisory/chat`;
  const res = await fetch(chatUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      locale,
      householdMode,
    }),
  }).catch((err) => {
    throw new Error(`Connection to advisory AI failed (${chatUrl}): ${err.message}`);
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Advisory chat API returned HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data;
}

const TOOLS = [
  {
    name: 'advisory_chat',
    description:
      'Send a client question or life event to the Syntropy AI Wealth & Cashflow Advisor and receive personalized advisory narrative, three-pillar rationale, and optimizer action cards.',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The client inquiry, situation, or question for the advisor AI.',
        },
        householdMode: {
          type: 'string',
          enum: ['INDIVIDUAL', 'FAMILY_HOUSEHOLD'],
          description: 'Whether to evaluate cashflow under INDIVIDUAL or FAMILY_HOUSEHOLD runway floor rules.',
          default: 'INDIVIDUAL',
        },
        locale: {
          type: 'string',
          enum: ['en', 'zh-CN', 'zh-HK', 'de'],
          description: 'Preferred language locale for the advisory response.',
          default: 'en',
        },
        email: {
          type: 'string',
          description: 'Client account email for authentication (defaults to demo account).',
        },
        password: {
          type: 'string',
          description: 'Client account password.',
        },
        token: {
          type: 'string',
          description: 'Optional pre-existing Bearer JWT token.',
        },
        url: {
          type: 'string',
          description: 'Advisory backend URL (defaults to https://wealth-advisor-ai.vercel.app).',
        },
      },
      required: ['message'],
    },
  },
];

function handleRpcMessage(msg) {
  if (msg.method === 'initialize') {
    return {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: 'client-advisory-mcp',
        version: '1.0.0',
      },
    };
  }

  if (msg.method === 'notifications/initialized') {
    return null;
  }

  if (msg.method === 'tools/list') {
    return { tools: TOOLS };
  }

  if (msg.method === 'tools/call') {
    const { name, arguments: args = {} } = msg.params || {};

    if (name === 'advisory_chat') {
      return (async () => {
        try {
          const result = await sendAdvisoryChat(args);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: `Advisory Error: ${err.message}`,
              },
            ],
          };
        }
      })();
    }

    throw new Error(`Unknown tool: ${name}`);
  }

  if (msg.method === 'ping') {
    return {};
  }

  throw new Error(`Method not supported: ${msg.method}`);
}

async function startStdio() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    let req;
    try {
      req = JSON.parse(line);
    } catch {
      continue;
    }

    const { id, jsonrpc } = req;
    try {
      const outcome = handleRpcMessage(req);
      if (outcome instanceof Promise) {
        const result = await outcome;
        if (id !== undefined) {
          process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
        }
      } else if (outcome !== null && id !== undefined) {
        process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result: outcome }) + '\n');
      }
    } catch (err) {
      if (id !== undefined) {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: '2.0',
            id,
            error: { code: -32603, message: err.message },
          }) + '\n',
        );
      }
    }
  }
}

// Support direct CLI invocation for testing: node scripts/mcp-client-advisory.mjs "My question"
if (process.argv[2] && !process.argv[2].startsWith('-')) {
  const query = process.argv[2];
  const householdMode = process.argv[3] || 'INDIVIDUAL';
  const url = process.argv[4] || DEFAULT_BASE_URL;

  console.log(`Sending client question to ${url}...`);
  console.log(`Query: "${query}"\n`);

  sendAdvisoryChat({ message: query, householdMode, url })
    .then((res) => {
      console.log('ADVISORY RESPONSE:');
      console.log(JSON.stringify(res, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error:', err.message);
      process.exit(1);
    });
} else {
  startStdio();
}
