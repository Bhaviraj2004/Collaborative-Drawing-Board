import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { SendMessageDto, LoadChatHistoryDto } from './dto/chat.dto';
import {
  DrawEventDto,
  JoinRoomDto,
  ClearCanvasDto,
  UndoDto,
  RedoDto,
  DrawShapeDto,
} from './dto/drawing.dto';
import { AddTextDto, UpdateTextDto, DeleteTextDto } from './dto/text.dto';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:5173',
      process.env.FRONTEND_URL || 'http://localhost:5173', // ✅ Dynamic
    ],
    credentials: true,
  },
})
export class DrawingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<
    string,
    { userId: string; username: string; roomId: string }
  >();

  constructor(private readonly redisService: RedisService) {}

  handleConnection(client: Socket) {
    console.log(`✅ Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnected: ${client.id}`);

    const userInfo = this.connectedUsers.get(client.id);
    if (userInfo) {
      const { roomId, username, userId } = userInfo;

      await this.redisService.removeUserFromRoom(roomId, userId);

      const userCount = await this.redisService.getRoomUserCount(roomId);
      this.server.to(roomId).emit('userLeft', {
        username,
        userCount,
        userId,
      });

      this.connectedUsers.delete(client.id);

      if (userCount === 0) {
        await this.redisService.deleteRoom(roomId);
        console.log(`🗑️ Room ${roomId} deleted (empty)`);
      }
    }
  }

  @SubscribeMessage('createRoom')
  async handleCreateRoom(
    @MessageBody() data: { roomName: string; username: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = this.generateRoomId();
    const userId = this.generateUserId();

    await this.redisService.createRoom(roomId, {
      roomId,
      name: data.roomName,
      createdAt: Date.now(),
      createdBy: data.username,
      maxUsers: 10,
    });

    const user = {
      id: userId,
      username: data.username,
      joinedAt: Date.now(),
    };

    await this.redisService.addUserToRoom(roomId, user);

    client.join(roomId);

    this.connectedUsers.set(client.id, {
      userId,
      username: data.username,
      roomId,
    });

    console.log(`🏠 Room created: ${roomId} by ${data.username}`);

    return {
      roomId,
      userId,
      roomName: data.roomName,
    };
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, username } = data;

    const roomMeta = await this.redisService.getRoomMeta(roomId);
    if (!roomMeta) {
      client.emit('error', { message: 'Room not found' });
      return;
    }

    const userCount = await this.redisService.getRoomUserCount(roomId);
    if (userCount >= roomMeta.maxUsers) {
      client.emit('error', { message: 'Room is full' });
      return;
    }

    const userId = this.generateUserId();

    const user = {
      id: userId,
      username,
      joinedAt: Date.now(),
    };

    await this.redisService.addUserToRoom(roomId, user);
    client.join(roomId);
    this.connectedUsers.set(client.id, { userId, username, roomId });

    const strokes = await this.redisService.getStrokes(roomId);
    const flatEvents = strokes.flatMap((stroke) => stroke.events);
    client.emit('drawingHistory', flatEvents);

    const shapes = await this.redisService.getShapes(roomId);
    client.emit('shapesHistory', shapes);

    const textElements = await this.redisService.getTexts(roomId);
    client.emit('textsHistory', textElements);

    // ✅ NEW: Send chat history
    const chatMessages = await this.redisService.getChatHistory(roomId, 50);
    client.emit('chatHistory', chatMessages);

    const newUserCount = await this.redisService.getRoomUserCount(roomId);
    this.server.to(roomId).emit('userJoined', {
      username,
      userCount: newUserCount,
    });

    console.log(`👤 ${username} joined room: ${roomId}`);

    return {
      success: true,
      userId,
      roomId,
      userCount: newUserCount,
    };
  }

  @SubscribeMessage('drawShape')
  async handleDrawShape(
    @MessageBody() data: DrawShapeDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, ...shapeData } = data;

    console.log(`🔷 Shape drawn: ${shapeData.type} in room: ${roomId}`);

    // Save shape to Redis
    const shape = {
      id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...shapeData,
      timestamp: Date.now(),
    };

    await this.redisService.addShape(roomId, shape);

    // Broadcast to all users in room (including sender for consistency)
    this.server.to(roomId).emit('shapeDrawn', shape);
    client.emit('shapeDrawn', shape); // Send to sender too
  }

  // ✅ NEW: Chat handlers
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, message } = data;

    const userInfo = this.connectedUsers.get(client.id);
    if (!userInfo) {
      client.emit('error', { message: 'User not found' });
      return;
    }

    const { userId, username } = userInfo;

    const chatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      username,
      text: message,
      timestamp: Date.now(),
    };

    // Save to Redis
    await this.redisService.saveChatMessage(roomId, chatMessage);

    this.server.to(roomId).emit('receiveMessage', chatMessage);
    // client.emit('receiveMessage', chatMessage);

    console.log(`💬 Message from ${username} in room ${roomId}: ${message}`);
  }
  @SubscribeMessage('loadChatHistory')
  async handleLoadChatHistory(
    @MessageBody() data: LoadChatHistoryDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, limit = 50 } = data;

    const messages = await this.redisService.getChatHistory(roomId, limit);

    client.emit('chatHistory', messages);

    console.log(
      `📜 Loaded ${messages.length} chat messages for room ${roomId}`,
    );
  }
  @SubscribeMessage('addText')
  async handleAddText(
    @MessageBody() data: AddTextDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, ...textData } = data;

    console.log(`✍️ Text added: "${textData.text}" in room: ${roomId}`);

    // Save text to Redis
    const textElement = {
      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...textData,
      timestamp: Date.now(),
    };

    await this.redisService.addText(roomId, textElement);

    // Broadcast to all users
    this.server.to(roomId).emit('textAdded', textElement);
    client.emit('textAdded', textElement);
  }

  @SubscribeMessage('updateText')
  handleUpdateText(
    @MessageBody() data: UpdateTextDto,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Text updated:', data);

    // Broadcast to all in room
    client.to(data.roomId).emit('textUpdated', data);

    return {
      event: 'textUpdated',
      data,
    };
  }

  @SubscribeMessage('deleteText')
  handleDeleteText(
    @MessageBody() data: DeleteTextDto,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Text deleted:', data);

    // Broadcast to all in room
    client.to(data.roomId).emit('textDeleted', data);

    return {
      event: 'textDeleted',
      data,
    };
  }

  @SubscribeMessage('draw')
  async handleDraw(
    @MessageBody() data: DrawEventDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, ...drawData } = data;

    // ✅ Drawing event ko Redis mein save karo WITH color and brushSize
    await this.redisService.addDrawingEvent(roomId, {
      ...drawData, // This includes color, brushSize, tool
      timestamp: Date.now(),
    });

    // ✅ Room ke sabhi users ko broadcast karo (except sender) WITH full data
    client.to(roomId).emit('drawing', drawData);
  }

  @SubscribeMessage('clearCanvas')
  async handleClearCanvas(
    @MessageBody() data: ClearCanvasDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId } = data;

    await this.redisService.clearDrawingHistory(roomId);
    await this.redisService.clearShapes(roomId);
    await this.redisService.clearTexts(roomId);
    await this.redisService.saveCanvasState(roomId, '');
    // await this.redisService.clearChat(roomId); // ✅ Optional: clear chat too

    this.server.to(roomId).emit('canvasCleared');

    console.log(`🧹 Canvas cleared in room: ${roomId}`);
  }

  @SubscribeMessage('saveCanvas')
  async handleSaveCanvas(
    @MessageBody() data: { roomId: string; canvasData: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.redisService.saveCanvasState(data.roomId, data.canvasData);
    console.log(`💾 Canvas saved for room: ${data.roomId}`);
  }

  @SubscribeMessage('getActiveRooms')
  async handleGetActiveRooms(@ConnectedSocket() client: Socket) {
    const roomIds = await this.redisService.getActiveRooms();
    const rooms: any[] = [];

    for (const roomId of roomIds) {
      const meta = await this.redisService.getRoomMeta(roomId);
      const userCount = await this.redisService.getRoomUserCount(roomId);
      rooms.push({ ...meta, userCount });
    }

    client.emit('activeRooms', rooms);
  }

  // Helper methods
  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  @SubscribeMessage('startStroke')
  async handleStartStroke(
    @MessageBody() data: { roomId: string; strokeId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, strokeId } = data;

    // Clear redo stack when new stroke starts
    await this.redisService.clearRedoStack(roomId);

    // Initialize new stroke in Redis
    await this.redisService.startStroke(roomId, strokeId);

    console.log(`🎨 Stroke started: ${strokeId} in room: ${roomId}`);
  }

  // Add this after the redo handler

  @SubscribeMessage('cursorMove')
  handleCursorMove(
    @MessageBody() data: { roomId: string; x: number; y: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userInfo = this.connectedUsers.get(client.id);
    if (!userInfo) {
      console.log('❌ User info not found for cursor');
      return;
    }

    const { userId, username } = userInfo;

    console.log(`🖱️ Cursor move from ${username} at (${data.x}, ${data.y})`);

    // Broadcast to everyone in room EXCEPT sender
    client.to(data.roomId).emit('cursorUpdate', {
      userId,
      username,
      x: data.x,
      y: data.y,
    });
  }

  @SubscribeMessage('endStroke')
  async handleEndStroke(
    @MessageBody() data: { roomId: string; strokeId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, strokeId } = data;

    // Mark stroke as complete
    await this.redisService.endStroke(roomId, strokeId);

    console.log(`✅ Stroke ended: ${strokeId} in room: ${roomId}`);
  }

  @SubscribeMessage('undo')
  async handleUndo(
    @MessageBody() data: UndoDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId } = data;

    // Get all strokes
    const strokes = await this.redisService.getStrokes(roomId);

    if (strokes.length === 0) {
      return;
    }

    // Remove last stroke
    const lastStroke = strokes[strokes.length - 1];
    await this.redisService.removeLastStroke(roomId);

    // Add to redo stack
    await this.redisService.addToRedoStack(roomId, lastStroke);

    // Get updated strokes
    const updatedStrokes = await this.redisService.getStrokes(roomId);

    // Flatten strokes to events for rendering
    const flatEvents = updatedStrokes.flatMap((stroke) => stroke.events);

    // Broadcast to all users
    this.server.to(roomId).emit('undoPerformed', {
      strokes: updatedStrokes,
      events: flatEvents,
    });

    console.log(`↩️ Undo performed in room: ${roomId}`);
  }

  @SubscribeMessage('redo')
  async handleRedo(
    @MessageBody() data: RedoDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId } = data;

    // Get redo stack
    const redoStack = await this.redisService.getRedoStack(roomId);

    if (redoStack.length === 0) {
      return;
    }

    // Get last redo stroke
    const redoStroke = redoStack[redoStack.length - 1];

    // Add back to strokes
    await this.redisService.addStroke(roomId, redoStroke);

    // Remove from redo stack
    await this.redisService.removeLastRedoStroke(roomId);

    // Get updated strokes
    const updatedStrokes = await this.redisService.getStrokes(roomId);

    // Flatten for rendering
    const flatEvents = updatedStrokes.flatMap((stroke) => stroke.events);

    // Broadcast to all users
    this.server.to(roomId).emit('redoPerformed', {
      strokes: updatedStrokes,
      events: flatEvents,
    });

    console.log(`↪️ Redo performed in room: ${roomId}`);
  }
}
