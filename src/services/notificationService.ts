export interface AppNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
}

export const notificationService = {
  async list(): Promise<AppNotification[]> {
    return [];
  },
};
