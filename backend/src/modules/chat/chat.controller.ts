import type {
  Request,
  Response,
} from 'express';

import {
  createTenantContext,
} from '../../common/types/tenant-context.js';

import {
  conversationIdParamSchema,
  createConversationSchema,
  sendMessageSchema,
} from './chat.schema.js';

import {
  chatService,
} from './chat.service.js';

function unauthorized(
  response: Response,
) {
  return response.status(401).json({
    error: 'UNAUTHORIZED',
    message:
      'Authentication required.',
  });
}

function validationError(
  response: Response,
  message: string,
) {
  return response.status(400).json({
    error: 'VALIDATION_ERROR',
    message,
  });
}

export const chatController = {
  async listConversations(
    request: Request,
    response: Response,
  ) {
    if (!request.user) {
      return unauthorized(response);
    }

    const context =
      createTenantContext(
        request.user,
      );

    const conversations =
      await chatService.list(
        context,
        request.user.id,
      );

    return response.status(200).json({
      conversations,
    });
  },

  async createConversation(
    request: Request,
    response: Response,
  ) {
    if (!request.user) {
      return unauthorized(response);
    }

    const parsedInput =
      createConversationSchema.safeParse(
        request.body,
      );

    if (!parsedInput.success) {
      return validationError(
        response,
        'Invalid conversation data.',
      );
    }

    const context =
      createTenantContext(
        request.user,
      );

    const conversation =
      await chatService.create(
        context,
        request.user.id,
        parsedInput.data,
      );

    return response.status(201).json({
      conversation,
    });
  },

  async getConversation(
    request: Request,
    response: Response,
  ) {
    if (!request.user) {
      return unauthorized(response);
    }

    const parsedParams =
      conversationIdParamSchema.safeParse(
        request.params,
      );

    if (!parsedParams.success) {
      return validationError(
        response,
        'Invalid conversation id.',
      );
    }

    const context =
      createTenantContext(
        request.user,
      );

    const conversation =
      await chatService.getById(
        context,
        request.user.id,
        parsedParams.data.conversationId,
      );

    return response.status(200).json({
      conversation,
    });
  },

  async sendMessage(
    request: Request,
    response: Response,
  ) {
    if (!request.user) {
      return unauthorized(response);
    }

    const parsedParams =
      conversationIdParamSchema.safeParse(
        request.params,
      );

    if (!parsedParams.success) {
      return validationError(
        response,
        'Invalid conversation id.',
      );
    }

    const parsedInput =
      sendMessageSchema.safeParse(
        request.body,
      );

    if (!parsedInput.success) {
      return validationError(
        response,
        'Invalid message data.',
      );
    }

    const context =
      createTenantContext(
        request.user,
      );

    const result =
      await chatService.sendMessage(
        context,
        request.user.id,
        parsedParams.data.conversationId,
        parsedInput.data.content,
      );

    return response.status(201).json(result);
  },
};
