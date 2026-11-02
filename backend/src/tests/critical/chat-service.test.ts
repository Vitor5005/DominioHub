import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const mocks = vi.hoisted(() => ({
  findConversation: vi.fn(),
  findRecentMessages: vi.fn(),
  appendExchange: vi.fn(),
  generate: vi.fn(),
}));

vi.mock('../../config/env.js', () => ({
  env: {
    AI_HISTORY_LIMIT: 20,
  },
}));

vi.mock('../../modules/chat/chat.repository.js', () => ({
  chatRepository: {
    findConversation: mocks.findConversation,
    findRecentMessages: mocks.findRecentMessages,
    appendExchange: mocks.appendExchange,
  },
}));

vi.mock(
  '../../infrastructure/providers/ai/ai-provider.factory.js',
  () => ({
    aiProvider: {
      generate: mocks.generate,
    },
  }),
);

import {
  chatService,
} from '../../modules/chat/chat.service.js';
import {
  AIProviderError,
  ConversationNotFoundError,
} from '../../modules/chat/chat.errors.js';

const context = {
  organizationId: 'organization-1',
};

const userId =
  'user-1';

describe('chatService.sendMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects missing or cross-tenant conversations', async () => {
    mocks.findConversation.mockResolvedValue(null);

    await expect(
      chatService.sendMessage(
        context,
  userId,
        'conversation-1',
        'Hello',
      ),
    ).rejects.toBeInstanceOf(
      ConversationNotFoundError,
    );

    expect(
      mocks.findRecentMessages,
    ).not.toHaveBeenCalled();
  });

  it('sends ordered USER and ASSISTANT history plus the new message and persists the exchange', async () => {
    mocks.findConversation.mockResolvedValue({
      id: 'conversation-1',
    });
    mocks.findRecentMessages.mockResolvedValue([
      {
        role: 'USER',
        content: 'First question',
      },
      {
        role: 'SYSTEM',
        content: 'Ignored context',
      },
      {
        role: 'ASSISTANT',
        content: 'First answer',
      },
    ]);
    mocks.generate.mockResolvedValue('Second answer');

    const exchange = {
      userMessage: {
        id: 'message-user',
      },
      assistantMessage: {
        id: 'message-assistant',
      },
    };
    mocks.appendExchange.mockResolvedValue(exchange);

    await expect(
      chatService.sendMessage(
        context,
  userId,
        'conversation-1',
        'Second question',
      ),
    ).resolves.toEqual(exchange);

    expect(mocks.generate).toHaveBeenCalledWith([
      {
        role: 'user',
        content: 'First question',
      },
      {
        role: 'assistant',
        content: 'First answer',
      },
      {
        role: 'user',
        content: 'Second question',
      },
    ]);
    expect(mocks.appendExchange).toHaveBeenCalledWith(
      'organization-1',
  userId,
      'conversation-1',
      'Second question',
      'Second answer',
    );
  });

  it('does not persist a partial exchange when the provider fails', async () => {
    mocks.findConversation.mockResolvedValue({
      id: 'conversation-1',
    });
    mocks.findRecentMessages.mockResolvedValue([]);
    mocks.generate.mockRejectedValue(
      new Error('Provider unavailable'),
    );

    await expect(
      chatService.sendMessage(
        context,
  userId,
        'conversation-1',
        'Hello',
      ),
    ).rejects.toBeInstanceOf(AIProviderError);

    expect(mocks.appendExchange).not.toHaveBeenCalled();
  });
});
