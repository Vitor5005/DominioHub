import { env } from '../../../config/env.js';

import { AIProviderError } from '../../../modules/chat/chat.errors.js';

import {
  logger,
  serializeError,
} from '../../../common/logging/logger.js';

import type {
  AIMessage,
  AIProvider,
} from './ai-provider.js';

const SYSTEM_INSTRUCTION =
  'Você é o assistente de suporte do DomínioHub, uma plataforma SaaS para agências gerenciarem domínios, eventos e integrações. Responda de forma objetiva, útil e profissional. Não invente dados específicos da organização que não estejam presentes na conversa.';

interface GeminiResponsePart {
  text?: string;
}

interface GeminiResponseContent {
  parts?: GeminiResponsePart[];
}

interface GeminiCandidate {
  content?: GeminiResponseContent;
}

interface GeminiGenerateContentResponse {
  candidates?: GeminiCandidate[];
}

function extractResponseText(
  data: GeminiGenerateContentResponse,
): string {
  const parts =
    data.candidates?.[0]?.content?.parts;

  if (!parts) {
    throw new AIProviderError();
  }

  const text = parts
    .map((part) => part.text ?? '')
    .join('')
    .trim();

  if (!text) {
    throw new AIProviderError();
  }

  return text;
}

export class GeminiAIProvider
  implements AIProvider
{
  async generate(
    messages: AIMessage[],
  ): Promise<string> {
    if (!env.GEMINI_API_KEY) {
      throw new AIProviderError();
    }

    const controller =
      new AbortController();

    const timeout = setTimeout(
      () => {
        controller.abort();
      },
      env.AI_REQUEST_TIMEOUT_MS,
    );

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`;

    try {
      const response = await fetch(
        url,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            'x-goog-api-key':
              env.GEMINI_API_KEY,
          },

          signal: controller.signal,

          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text:
                    SYSTEM_INSTRUCTION,
                },
              ],
            },

            contents: messages.map(
              (message) => ({
                role:
                  message.role ===
                  'assistant'
                    ? 'model'
                    : 'user',

                parts: [
                  {
                    text:
                      message.content,
                  },
                ],
              }),
            ),

            generationConfig: {
              thinkingConfig: {
                thinkingLevel: 'low',
              },
            },
          }),
        },
      );

      if (!response.ok) {
        logger.error('Gemini request failed', {
          status: response.status,
          statusText: response.statusText,
        });

        throw new AIProviderError();
      }

      const data =
        (await response.json()) as
          GeminiGenerateContentResponse;

      return extractResponseText(
        data,
      );
    } catch (error) {
      if (
        error instanceof
        AIProviderError
      ) {
        throw error;
      }

      if (
        error instanceof DOMException &&
        error.name === 'AbortError'
      ) {
        logger.warn('Gemini request timed out');

        throw new AIProviderError();
      }

      logger.error('Gemini request failed unexpectedly', {
        error: serializeError(error),
      });

      throw new AIProviderError();
    } finally {
      clearTimeout(timeout);
    }
  }
}
