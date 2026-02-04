export interface Message {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}

export interface ChatState {
  messages: Message[];
  unreadCount: number;
  isOpen: boolean;
}