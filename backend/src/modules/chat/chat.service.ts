import type {
  TenantContext,
} from '../../common/types/tenant-context.js';

import { env } from '../../config/env.js';

import {
  aiProvider,
} from '../../infrastructure/providers/ai/ai-provider.factory.js';
import type {
  AIMessage,
} from '../../infrastructure/providers/ai/ai-provider.js';

import {
  AIProviderError,
  ConversationNotFoundError,
} from './chat.errors.js';
import {
  chatRepository,
} from './chat.repository.js';

export const chatService = {
  list(
    context: TenantContext,
    userId: string,
  ) {
    return chatRepository.listConversations(
      context.organizationId,
      userId,
    );
  },

  create(
    context: TenantContext,
    userId: string,
    input: {
      title?: string | undefined;
    },
  ) {
    return chatRepository.createConversation(
      context.organizationId,
      userId,
      input.title ?? 'Nova conversa',
    );
  },

  async getById(
    context: TenantContext,
    userId: string,
    conversationId: string,
  ) {
    const conversation =
      await chatRepository.findConversationWithMessages(
        context.organizationId,
        userId,
        conversationId,
      );

    if (!conversation) {
      throw new ConversationNotFoundError();
    }

    return conversation;
  },

  async sendMessage(
    context: TenantContext,
    userId: string,
    conversationId: string,
    content: string,
  ) {
    const conversation =
      await chatRepository.findConversation(
        context.organizationId,
        userId,
        conversationId,
      );

    if (!conversation) {
      throw new ConversationNotFoundError();
    }

    const recentMessages =
      await chatRepository.findRecentMessages(
        context.organizationId,
        userId,
        conversationId,
        env.AI_HISTORY_LIMIT,
      );

    if (!recentMessages) {
      throw new ConversationNotFoundError();
    }

    const messages: AIMessage[] = recentMessages
      .filter(
        (message) =>
          message.role === 'USER' ||
          message.role === 'ASSISTANT',
      )
      .map((message) => ({
        role:
          message.role === 'USER'
            ? 'user'
            : 'assistant',
        content: message.content,
      }));

    messages.push({
      role: 'user',
      content,
    });

    let assistantContent: string;

    try {
      assistantContent = await aiProvider.generate(
        messages,
      );
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }

      throw new AIProviderError();
    }

    const exchange =
      await chatRepository.appendExchange(
        context.organizationId,
        userId,
        conversationId,
        content,
        assistantContent,
      );

    if (!exchange) {
      throw new ConversationNotFoundError();
    }

    return exchange;
  },
};
