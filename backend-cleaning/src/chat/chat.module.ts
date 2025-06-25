// src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatGateway } from './gateway/chat.gateway';
import { AuthModule } from '../auth/auth.module'; // Importe AuthModule

@Module({
  imports: [
    PrismaModule,
    AuthModule, // <--- Certifique-se de que AuthModule está importado aqui
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService], // Exporta ChatService se outros módulos precisarem usá-lo
})
export class ChatModule {}