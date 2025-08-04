// src/chat/chat.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  NotFoundException,
  ForbiddenException,
  BadRequestException, // Importado para lidar com exceções específicas
} from '@nestjs/common';
import { ChatService, ConversationItem } from './chat.service'; // Importar ConversationItem (ainda necessário para a Promise, mas não para o ApiResponse.type)
import { SendMessageDto } from './dto/send-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Message } from './entities/message.entity'; // Certifique-se que Message é uma entidade válida ou DTO
import { ChatDetailsDto } from './dto/chat-details.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ConversationItemDto } from './dto/conversation-item.dto'; // <-- IMPORTAR O NOVO DTO AQUI

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard) // Protege todas as rotas do controlador
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('find-or-create/provider/:providerId/client/:clientId')
  @ApiOperation({ summary: 'Encontra um chat existente ou cria um novo entre um provedor e um cliente' })
  @ApiParam({ name: 'providerId', description: 'ID do provedor', type: String })
  @ApiParam({ name: 'clientId', description: 'ID do cliente', type: String })
  @ApiResponse({
    status: 200,
    description: 'Chat encontrado ou criado com sucesso.',
    type: ChatDetailsDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Apenas o cliente ou o provedor podem iniciar um chat entre si.' })
  @UseGuards(RolesGuard) // Adicionado RolesGuard para validação de papel
  @Roles(UserRole.CLIENT, UserRole.PROVIDER, UserRole.ADMIN) // Permite Cliente, Provedor e Admin
  async findOrCreateChat(
    @Req() req: Request,
    @Param('providerId') providerId: string,
    @Param('clientId') clientId: string,
  ): Promise<ChatDetailsDto> {
    const currentUserId = req.user['userId'];
    const currentUserRole = req.user['role'];

    // Validação de segurança: O usuário autenticado deve ser um dos participantes ou um ADMIN.
    if (currentUserRole === UserRole.ADMIN) {
      // Admin pode acessar qualquer chat
    } else if (currentUserRole === UserRole.CLIENT) {
      if (currentUserId !== clientId) {
        throw new ForbiddenException('Como cliente, você só pode iniciar chats para si mesmo.');
      }
    } else if (currentUserRole === UserRole.PROVIDER) {
      if (currentUserId !== providerId) {
        throw new ForbiddenException('Como provedor, você só pode iniciar chats para si mesmo.');
      }
    } else {
      throw new ForbiddenException('Você não tem permissão para acessar este chat.');
    }

    // O ChatService já contém a lógica de permissão baseada no status do agendamento.
    return this.chatService.findOrCreateChat(clientId, providerId);
  }


  @Post(':chatId/messages')
  @ApiOperation({ summary: 'Enviar uma nova mensagem em uma conversa' })
  @ApiResponse({
    status: 201,
    description: 'Mensagem enviada com sucesso.',
    type: Message,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido. Não há agendamento confirmado ou o agendamento foi concluído/cancelado.' })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada.' })
  @ApiResponse({ status: 400, description: 'Remetente ou destinatário inválido.' })
  async sendMessage(
    @Req() req: Request,
    @Param('chatId') chatId: string,
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<Message> {
    const senderId = req.user['userId'];

    try {
      return await this.chatService.createMessage(
        chatId,
        senderId,
        sendMessageDto.receiverId,
        sendMessageDto.content,
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error; // Re-lança as exceções do serviço diretamente
      }
      throw new ForbiddenException('Não foi possível enviar a mensagem. Verifique as permissões.'); // Erro genérico
    }
  }

  @Get(':chatId/messages')
  @ApiOperation({ summary: 'Obter mensagens de uma conversa específica' })
  @ApiResponse({
    status: 200,
    description: 'Lista de mensagens da conversa.',
    type: [Message],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido. Não há agendamento confirmado ou o agendamento foi concluído/cancelado.' })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada.' })
  async getMessages(
    @Req() req: Request,
    @Param('chatId') chatId: string,
    @Query() getMessagesDto: GetMessagesDto,
  ): Promise<Message[]> {
    const userId = req.user['userId']; // Para verificação de permissão

    const offset = parseInt(getMessagesDto.offset, 10) || 0;
    const limit = parseInt(getMessagesDto.limit, 10) || 50;

    try {
      // O ChatService já contém a lógica de permissão
      return await this.chatService.getMessagesByChatId(chatId, offset, limit);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error; // Re-lança as exceções do serviço diretamente
      }
      throw new ForbiddenException('Você não tem acesso a esta conversa ou ela não existe.'); // Erro genérico
    }
  }

  @Get('me/conversations')
  @ApiOperation({ summary: 'Obter a lista de conversas do usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Lista de conversas do usuário.',
    type: [ConversationItemDto], // <-- USAR O DTO AQUI
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  async getMyConversations(
    @Req() req: Request,
  ): Promise<ConversationItem[]> { // O tipo de retorno da função ainda é a interface, pois é o que o serviço retorna
    const userId = req.user['userId'];
    return this.chatService.getConversationsForUser(userId);
  }
}