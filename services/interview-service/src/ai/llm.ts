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
    timeout: 120_000,
    maxRetries: 5,
    openAIApiKey: env.openai.apiKey,
    ...(env.openai.baseUrl ? { configuration: { baseURL: env.openai.baseUrl } } : {}),
  });
}
