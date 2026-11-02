export type AIMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export interface AIProvider {
  generate(
    messages: AIMessage[],
  ): Promise<string>;
}
