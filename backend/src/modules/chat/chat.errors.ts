import {
  AppError,
} from '../../common/errors/app-error.js';

export class ConversationNotFoundError
  extends AppError
{
  constructor() {
    super(
      404,
      'CONVERSATION_NOT_FOUND',
      'Conversation not found.',
    );
  }
}

export class AIProviderError
  extends AppError
{
  constructor() {
    super(
      502,
      'AI_PROVIDER_ERROR',
      'AI provider is currently unavailable.',
    );
  }
}
