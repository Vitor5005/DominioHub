import {
  prisma,
} from '../../infrastructure/database/prisma.js';

const publicMessageSelect = {
  id: true,
  conversationId: true,
  role: true,
  content: true,
  createdAt: true,
} as const;

const publicConversationSelect = {
  id: true,
  organizationId: true,
  userId: true,
  title: true,
  createdAt: true,
  updatedAt: true,
} as const;

const conversationWithMessagesSelect = {
  ...publicConversationSelect,
  messages: {
    select: publicMessageSelect,
    orderBy: {
      createdAt: 'asc',
    },
  },
} as const;

export const chatRepository = {
  listConversations(
    organizationId: string,
    userId: string,
  ) {
    return prisma.conversation.findMany({
      where: {
        organizationId,
        userId,
      },

      select: publicConversationSelect,

      orderBy: {
        updatedAt: 'desc',
      },
    });
  },

  createConversation(
    organizationId: string,
    userId: string,
    title: string,
  ) {
    return prisma.conversation.create({
      data: {
        organizationId,
        userId,
        title,
      },

      select: publicConversationSelect,
    });
  },

  findConversation(
    organizationId: string,
    userId: string,
    conversationId: string,
  ) {
    return prisma.conversation.findFirst({
      where: {
        id: conversationId,
        organizationId,
        userId,
      },

      select: publicConversationSelect,
    });
  },

  findConversationWithMessages(
    organizationId: string,
    userId: string,
    conversationId: string,
  ) {
    return prisma.conversation.findFirst({
      where: {
        id: conversationId,
        organizationId,
        userId,
      },

      select: conversationWithMessagesSelect,
    });
  },

  async findRecentMessages(
    organizationId: string,
    userId: string,
    conversationId: string,
    limit: number,
  ) {
    const conversation =
      await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          organizationId,
          userId,
        },

        select: {
          id: true,
        },
      });

    if (!conversation) {
      return null;
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversation.id,
      },

      select: publicMessageSelect,

      orderBy: {
        createdAt: 'desc',
      },

      take: limit,
    });

    return messages.reverse();
  },

  async appendExchange(
    organizationId: string,
    userId: string,
    conversationId: string,
    userContent: string,
    assistantContent: string,
  ) {
    return prisma.$transaction(async (transaction) => {
      const conversation =
        await transaction.conversation.findFirst({
          where: {
            id: conversationId,
            organizationId,
            userId,
          },

          select: {
            id: true,
          },
        });

      if (!conversation) {
        return null;
      }

      const userMessage =
        await transaction.message.create({
          data: {
            conversationId: conversation.id,
            role: 'USER',
            content: userContent,
          },

          select: publicMessageSelect,
        });

      const assistantMessage =
        await transaction.message.create({
          data: {
            conversationId: conversation.id,
            role: 'ASSISTANT',
            content: assistantContent,
          },

          select: publicMessageSelect,
        });

      await transaction.conversation.updateMany({
        where: {
          id: conversation.id,
          organizationId,
          userId,
        },

        data: {
          updatedAt: new Date(),
        },
      });

      return {
        userMessage,
        assistantMessage,
      };
    });
  },
};
