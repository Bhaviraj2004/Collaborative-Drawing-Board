export class AddTextDto {
  roomId: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  userId: string;
  username: string;
}

export class UpdateTextDto {
  roomId: string;
  textId: string;
  x: number;
  y: number;
}

export class DeleteTextDto {
  roomId: string;
  textId: string;
}
