export interface ConversationPreview {
  id: string;
  name: string;
  role: string;
  message: string;
  time: string;
  initials: string;
}

export const messageService = {
  async listConversations(): Promise<ConversationPreview[]> {
    return [
      {
        id: "conversation-1",
        name: "Adekunle Adebayo",
        role: "Electrician",
        message: "Thanks, I can be there by 10am.",
        time: "9:41 AM",
        initials: "AA",
      },
    ];
  },
};
