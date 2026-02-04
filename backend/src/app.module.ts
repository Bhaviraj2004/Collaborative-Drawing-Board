import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrawingModule } from './drawing/drawing.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Globally available
    }),
    RedisModule,
    DrawingModule,
  ],
})
export class AppModule {}
