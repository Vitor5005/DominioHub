export type ChatMessageRole =
  | 'USER'
  | 'ASSISTANT'
  | 'SYSTEM';

export interface ConversationSummary {
  id: string;
  organizationId: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
}

export interface ConversationDetail
  extends ConversationSummary {
  messages: ChatMessage[];
}

export interface ConversationListResponse {
  conversations: ConversationSummary[];
}

export interface CreateConversationInput {
  title?: string;
}

export interface CreateConversationResponse {
  conversation: ConversationSummary;
}

export interface ConversationDetailResponse {
  conversation: ConversationDetail;
}

export interface SendMessageInput {
  content: string;
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}
