export class SendMessageDto {
  roomId: string;
  message: string;
}

export class LoadChatHistoryDto {
  roomId: string;
  limit?: number;
}
