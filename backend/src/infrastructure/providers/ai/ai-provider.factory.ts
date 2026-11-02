import { env } from '../../../config/env.js';

import type {
  AIProvider,
} from './ai-provider.js';

import {
  GeminiAIProvider,
} from './gemini-ai.provider.js';

export function createAIProvider():
  AIProvider {
  switch (env.AI_PROVIDER) {
    case 'gemini':
      return new GeminiAIProvider();
  }
}

export const aiProvider =
  createAIProvider();
