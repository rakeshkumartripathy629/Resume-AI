import { ChatOpenAI } from '@langchain/openai';
import { env } from '../config/env';
import { HttpError } from '../middleware/errorHandler';

export function getLlm(): ChatOpenAI {
  if (!env.openai.apiKey) {
    throw new HttpError(
      503,
      'LLM not configured. Set OPENAI_API_KEY in agent-service/.env'
    );
  }
  return new ChatOpenAI({
    model: env.openai.model,
    temperature: 0.2,
    timeout: 60_000,
    maxRetries: 2,
    openAIApiKey: env.openai.apiKey,
    ...(env.openai.baseUrl ? { configuration: { baseURL: env.openai.baseUrl } } : {}),
  });
}

const RATE_LIMIT_DELAY_MS = 2000;

function isRateLimitError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes('429') || msg.includes('rate limit') || msg.includes('tokens per minute');
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(fn: () => Promise<T>, label: string, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (isRateLimitError(err) && attempt < maxAttempts) {
        const delay = RATE_LIMIT_DELAY_MS * attempt;
        console.warn(
          JSON.stringify({
            level: 'warn',
            service: 'agent-service',
            msg: `${label} rate-limited (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms`,
          })
        );
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
