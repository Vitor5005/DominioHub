import {
  apiRequest,
} from '../../services/api-client';

import type {
  ConversationDetailResponse,
  ConversationListResponse,
  CreateConversationInput,
  CreateConversationResponse,
  SendMessageInput,
  SendMessageResponse,
} from './types';

export const chatApi = {
  listConversations() {
    return apiRequest<ConversationListResponse>(
      '/chat/conversations',
      {
        method: 'GET',
      },
    );
  },

  createConversation(
    input: CreateConversationInput,
  ) {
    return apiRequest<CreateConversationResponse>(
      '/chat/conversations',
      {
        method: 'POST',
        json: input,
      },
    );
  },

  getConversation(
    conversationId: string,
  ) {
    return apiRequest<ConversationDetailResponse>(
      `/chat/conversations/${encodeURIComponent(
        conversationId,
      )}`,
      {
        method: 'GET',
      },
    );
  },

  sendMessage(
    conversationId: string,
    input: SendMessageInput,
  ) {
    return apiRequest<SendMessageResponse>(
      `/chat/conversations/${encodeURIComponent(
        conversationId,
      )}/messages`,
      {
        method: 'POST',
        json: input,
      },
    );
  },
};
