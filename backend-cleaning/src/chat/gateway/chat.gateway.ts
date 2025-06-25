// src/chat/gateway/chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets'; // CORREÇÃO: Pacote agora instalado
import { Server, Socket } from 'socket.io'; // CORREÇÃO: Pacote agora instalado
import { ChatService } from '../chat.service'; // CORREÇÃO: Caminho atualizado (subir um nível)
import { SendMessageDto } from '../dto/send-message.dto'; // CORREÇÃO: Caminho atualizado (subir um nível)
import { UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; // Caminho já estava correto
import { WsAuthGuard } from '../../auth/guards/ws-auth.guard'; // Caminho já estava correto
import { Message } from '../entities/message.entity'; // CORREÇÃO: Caminho atualizado (subir um nível)

// Exemplo de um guard WsAuthGuard simples (você precisará implementá-lo)
// import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
// @Injectable()
// export class WsAuthGuard implements CanActivate {
//   canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
//     const client = context.switchToWs().getClient<Socket>();
//     // Aqui você implementaria a lógica de validação do token JWT do WebSocket
//     // Ex: const authToken = client.handshake.headers.authorization;
//     // Validar authToken e anexar user ao client.data
//     return true; // ou false se não autenticado
//   }
// }

@WebSocketGateway({
  cors: {
    origin: '*', // Ajuste para a origem do seu frontend em produção
    credentials: true,
  },
})
export class ChatGateway {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  // Opcional: Lidar com a conexão de um cliente
  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Cliente conectado (WebSocket): ${client.id}`);
    // Você pode associar o userId do cliente ao socket aqui após autenticação
    // client.data.userId = 'some-user-id';
  }

  // Opcional: Lidar com a desconexão de um cliente
  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado (WebSocket): ${client.id}`);
  }

  // Exemplo de um evento de chat
  @UseGuards(WsAuthGuard) // Use um guard específico para WebSocket para autenticação
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() payload: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    // Em um cenário real, o senderId viria do usuário autenticado no socket
    // client.data.userId deve ser definido pelo WsAuthGuard
    const senderId = client.data.userId || 'mock-sender-id'; // Substitua por lógica real

    this.logger.log(`Mensagem recebida de ${senderId} para chat ${payload.chatId}: ${payload.content}`);

    try {
      const message = await this.chatService.createMessage(
        payload.chatId,
        senderId,
        payload.receiverId,
        payload.content,
      );

      // Emite a mensagem para todos os clientes na sala do chat (ou para os envolvidos)
      this.server.to(payload.chatId).emit('newMessage', message);
      this.logger.log(`Mensagem enviada para a sala ${payload.chatId}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem: ${error.message}`);
      client.emit('errorMessage', 'Não foi possível enviar a mensagem.');
    }
  }

  // Exemplo de como um cliente pode "entrar" em uma sala de chat
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('joinChat')
  handleJoinChat(
    @MessageBody() chatId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    client.join(chatId);
    this.logger.log(`Cliente ${client.id} entrou na sala de chat: ${chatId}`);
    client.emit('joinedChat', `Você entrou na sala ${chatId}`);
  }
}