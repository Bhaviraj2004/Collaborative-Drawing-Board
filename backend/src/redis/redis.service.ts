import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private currentStrokes = new Map<string, string>(); // roomId -> current strokeId
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Environment variable se URL read karo
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      throw new Error('REDIS_URL not found in environment variables');
    }

    this.client = new Redis(redisUrl);

    this.client.on('connect', () => {
      console.log('✅ Redis connected successfully!');
    });

    this.client.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // Room operations
  async createRoom(roomId: string, roomData: any): Promise<void> {
    await this.client.set(
      `room:${roomId}:meta`,
      JSON.stringify(roomData),
      'EX',
      86400, // 24 hours expiry
    );
  }

  async endStroke(roomId: string, strokeId: string): Promise<void> {
    // Get all events for this stroke
    const history = await this.getDrawingHistory(roomId);

    // Get stroke start index (find where this strokeId starts)
    const currentStrokeIndex = history.findIndex(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (e: any) => e.strokeId === strokeId,
    );
    const strokeEvents =
      currentStrokeIndex >= 0 ? history.slice(currentStrokeIndex) : history;

    // Save as complete stroke
    const stroke = {
      id: strokeId,
      events: strokeEvents,
      timestamp: Date.now(),
    };

    await this.client.rpush(`room:${roomId}:strokes`, JSON.stringify(stroke));

    // Clear the drawing history buffer
    await this.client.del(`room:${roomId}:history`);

    this.currentStrokes.delete(roomId);
  }

  async startStroke(roomId: string, strokeId: string): Promise<void> {
    this.currentStrokes.set(roomId, strokeId);

    // Clear redo stack when new stroke starts
    await this.clearRedoStack(roomId);
  }

  async getRoomMeta(roomId: string): Promise<any> {
    const data = await this.client.get(`room:${roomId}:meta`);
    return data ? JSON.parse(data) : null;
  }

  async addUserToRoom(roomId: string, user: any): Promise<void> {
    await this.client.sadd(`room:${roomId}:users`, JSON.stringify(user));
  }

  async removeUserFromRoom(roomId: string, userId: string): Promise<void> {
    const users = await this.getRoomUsers(roomId);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const filtered = users.filter((u) => u.id !== userId);

    await this.client.del(`room:${roomId}:users`);

    for (const user of filtered) {
      await this.client.sadd(`room:${roomId}:users`, JSON.stringify(user));
    }
  }

  async getRoomUsers(roomId: string): Promise<any[]> {
    const users = await this.client.smembers(`room:${roomId}:users`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return users.map((u) => JSON.parse(u));
  }

  async getRoomUserCount(roomId: string): Promise<number> {
    return await this.client.scard(`room:${roomId}:users`);
  }

  // Drawing history operations
  async addDrawingEvent(roomId: string, drawEvent: any): Promise<void> {
    const currentStrokeId = this.currentStrokes.get(roomId);

    await this.client.rpush(
      `room:${roomId}:history`,
      JSON.stringify({ ...drawEvent, strokeId: currentStrokeId }),
    );
  }

  async getStrokes(roomId: string): Promise<any[]> {
    const strokes = await this.client.lrange(`room:${roomId}:strokes`, 0, -1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return strokes.map((s) => JSON.parse(s));
  }

  async addStroke(roomId: string, stroke: any): Promise<void> {
    await this.client.rpush(`room:${roomId}:strokes`, JSON.stringify(stroke));
  }

  async removeLastStroke(roomId: string): Promise<void> {
    await this.client.rpop(`room:${roomId}:strokes`);
  }

  async getDrawingHistory(roomId: string): Promise<any[]> {
    const history = await this.client.lrange(`room:${roomId}:history`, 0, -1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return history.map((h) => JSON.parse(h));
  }

  async clearDrawingHistory(roomId: string): Promise<void> {
    await this.client.del(`room:${roomId}:history`);
    await this.client.del(`room:${roomId}:strokes`);
    await this.clearRedoStack(roomId);
  }

  // Canvas state (base64 image)
  async saveCanvasState(roomId: string, canvasData: string): Promise<void> {
    await this.client.set(
      `room:${roomId}:canvas`,
      canvasData,
      'EX',
      86400, // 24 hours
    );
  }

  async getCanvasState(roomId: string): Promise<string | null> {
    return await this.client.get(`room:${roomId}:canvas`);
  }

  // Get all active rooms
  async getActiveRooms(): Promise<string[]> {
    const keys = await this.client.keys('room:*:meta');
    return keys.map((key) => key.split(':')[1]);
  }

  // Delete room (cleanup)
  async deleteRoom(roomId: string): Promise<void> {
    await this.client.del(`room:${roomId}:meta`);
    await this.client.del(`room:${roomId}:users`);
    await this.client.del(`room:${roomId}:history`);
    await this.client.del(`room:${roomId}:strokes`);
    await this.client.del(`room:${roomId}:redo`);
    await this.client.del(`room:${roomId}:canvas`);
    await this.client.del(`room:${roomId}:shapes`);
    await this.client.del(`room:${roomId}:texts`);
    await this.client.del(`room:${roomId}:chat`); // ✅ ADD
  }

  // Undo/Redo operations
  async removeLastDrawingEvent(roomId: string): Promise<void> {
    await this.client.rpop(`room:${roomId}:history`);
  }

  // Redo stack operations
  async addToRedoStack(roomId: string, stroke: any): Promise<void> {
    await this.client.rpush(`room:${roomId}:redo`, JSON.stringify(stroke));
    await this.client.ltrim(`room:${roomId}:redo`, -50, -1);
  }

  async getRedoStack(roomId: string): Promise<any[]> {
    const redoStack = await this.client.lrange(`room:${roomId}:redo`, 0, -1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return redoStack.map((r) => JSON.parse(r));
  }

  async removeLastRedoStroke(roomId: string): Promise<void> {
    await this.client.rpop(`room:${roomId}:redo`);
  }

  async clearRedoStack(roomId: string): Promise<void> {
    await this.client.del(`room:${roomId}:redo`);
  }
  // ✅ NEW: Shape operations
  async addShape(roomId: string, shape: any): Promise<void> {
    await this.client.rpush(`room:${roomId}:shapes`, JSON.stringify(shape));
  }

  async getShapes(roomId: string): Promise<any[]> {
    const shapes = await this.client.lrange(`room:${roomId}:shapes`, 0, -1);
    return shapes.map((s) => JSON.parse(s));
  }

  async clearShapes(roomId: string): Promise<void> {
    await this.client.del(`room:${roomId}:shapes`);
  }

  // ✅ NEW: Text operations
  async addText(roomId: string, text: any): Promise<void> {
    await this.client.rpush(`room:${roomId}:texts`, JSON.stringify(text));
  }

  async getTexts(roomId: string): Promise<any[]> {
    const texts = await this.client.lrange(`room:${roomId}:texts`, 0, -1);
    return texts.map((t) => JSON.parse(t));
  }

  async clearTexts(roomId: string): Promise<void> {
    await this.client.del(`room:${roomId}:texts`);
  }

  // ✅ NEW: Chat operations
  async saveChatMessage(roomId: string, message: any): Promise<void> {
    await this.client.rpush(`room:${roomId}:chat`, JSON.stringify(message));
    // Keep only last 100 messages
    await this.client.ltrim(`room:${roomId}:chat`, -100, -1);
  }

  async getChatHistory(roomId: string, limit: number): Promise<any[]> {
    const messages = await this.client.lrange(
      `room:${roomId}:chat`,
      -limit,
      -1,
    );
    return messages.map((m) => JSON.parse(m));
  }

  async clearChat(roomId: string): Promise<void> {
    await this.client.del(`room:${roomId}:chat`);
  }
}
