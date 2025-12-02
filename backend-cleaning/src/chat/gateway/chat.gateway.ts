// src/chat/gateway/chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../chat.service';
import { SendMessageDto } from '../dto/send-message.dto';
import {
  UseGuards,
  Logger,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'; // Importado ForbiddenException, NotFoundException, BadRequestException
import { WsAuthGuard } from '../../auth/guards/ws-auth.guard';
import { Message } from '../entities/message.entity';
// import { createAdapter } from '@socket.io/redis-adapter'; // Importar o adaptador Redis
// import { createClient } from 'redis'; // Importar o cliente Redis

@WebSocketGateway({
  cors: {
    origin: '*', // Ajuste para a origem do seu frontend em produção
    credentials: true,
  },
  // Adaptação para scaling horizontal com Redis
  // adapter: (() => {
  //   const pubClient = createClient({ host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT || '6379', 10), password: process.env.REDIS_PASSWORD });
  //   const subClient = pubClient.duplicate();
  //   return createAdapter(pubClient, subClient);
  // })(),
})
export class ChatGateway {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  // Opcional: Lidar com a conexão de um cliente
  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Cliente conectado (WebSocket): ${client.id}`);
    // O WsAuthGuard já anexa o userId e role ao client.data
  }

  // Opcional: Lidar com a desconexão de um cliente
  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado (WebSocket): ${client.id}`);
  }

  @UseGuards(WsAuthGuard) // Use um guard específico para WebSocket para autenticação
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() payload: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const senderId = client.data.userId; // Obtém o userId do socket, definido pelo WsAuthGuard

    if (!senderId) {
      this.logger.error(
        `[WebSocket] sendMessage: senderId não encontrado no socket para client ${client.id}`,
      );
      client.emit('errorMessage', {
        event: 'sendMessage',
        message: 'Erro de autenticação: ID do remetente não disponível.',
      });
      return;
    }

    this.logger.log(
      `[WebSocket] Mensagem recebida de ${senderId} para chat ${payload.chatId}: ${payload.content}`,
    );

    try {
      const message = await this.chatService.createMessage(
        payload.chatId,
        senderId,
        payload.receiverId,
        payload.content,
      );

      // Emite a mensagem para todos os clientes na sala do chat (ou para os envolvidos)
      this.server.to(payload.chatId).emit('newMessage', message);
      this.logger.log(
        `[WebSocket] Mensagem enviada para a sala ${payload.chatId}`,
      );
    } catch (error) {
      this.logger.error(
        `[WebSocket] Erro ao enviar mensagem para ${payload.chatId}: ${error.message}`,
      );
      if (error instanceof ForbiddenException) {
        client.emit('errorMessage', {
          event: 'sendMessage',
          message: error.message,
        });
      } else if (error instanceof NotFoundException) {
        client.emit('errorMessage', {
          event: 'sendMessage',
          message: 'Conversa não encontrada.',
        });
      } else if (error instanceof BadRequestException) {
        client.emit('errorMessage', {
          event: 'sendMessage',
          message: error.message,
        });
      } else {
        client.emit('errorMessage', {
          event: 'sendMessage',
          message:
            'Não foi possível enviar a mensagem devido a um erro interno.',
        });
      }
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('joinChat')
  async handleJoinChat(
    // Adicionado 'async' para poder usar await
    @MessageBody() chatId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const userId = client.data.userId; // Obtém o userId do socket

    if (!userId) {
      this.logger.error(
        `[WebSocket] joinChat: userId não encontrado no socket para client ${client.id}`,
      );
      client.emit('errorMessage', {
        event: 'joinChat',
        message: 'Erro de autenticação: ID do usuário não disponível.',
      });
      return;
    }

    try {
      // O ChatService.getMessagesByChatId já contém a lógica de permissão.
      // Chamamos para validar o acesso antes de permitir a entrada na sala.
      // Poderíamos ter um método mais leve como chatService.checkChatAccess(chatId, userId)
      // mas por enquanto, getMessagesByChatId serve para validar o acesso.
      await this.chatService.getMessagesByChatId(chatId, 0, 1); // Busca 1 mensagem para validar acesso

      client.join(chatId);
      this.logger.log(
        `[WebSocket] Cliente ${client.id} (User: ${userId}) entrou na sala de chat: ${chatId}`,
      );
      client.emit('joinedChat', `Você entrou na sala ${chatId}`);
    } catch (error) {
      this.logger.error(
        `[WebSocket] Erro ao tentar entrar na sala ${chatId} para user ${userId}: ${error.message}`,
      );
      if (error instanceof ForbiddenException) {
        client.emit('errorMessage', {
          event: 'joinChat',
          message: error.message,
        });
      } else if (error instanceof NotFoundException) {
        client.emit('errorMessage', {
          event: 'joinChat',
          message: 'Conversa não encontrada.',
        });
      } else {
        client.emit('errorMessage', {
          event: 'joinChat',
          message:
            'Não foi possível entrar na sala de chat devido a um erro interno.',
        });
      }
    }
  }
}
