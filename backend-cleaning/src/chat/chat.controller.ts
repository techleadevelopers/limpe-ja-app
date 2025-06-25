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
} from '@nestjs/common';
import { ChatService } from './chat.service';
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
import { Message } from './entities/message.entity';
import { ChatDetailsDto } from './dto/chat-details.dto'; // Importar o novo DTO
import { RolesGuard } from '../auth/guards/roles.guard'; // Assumindo que você tem um RolesGuard
import { Roles } from '../auth/decorators/roles.decorator'; // Assumindo que você tem um Roles decorator
import { UserRole } from '@prisma/client'; // Importar UserRole do Prisma

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
  // UseGuards(RolesGuard) // Pode ser necessário um RolesGuard aqui se você quiser restringir quem pode chamar isso
  // @Roles(UserRole.CLIENT, UserRole.PROVIDER) // Exemplo: Apenas clientes ou provedores podem iniciar chats
  async findOrCreateChat(
    @Req() req: Request,
    @Param('providerId') providerId: string,
    @Param('clientId') clientId: string,
  ): Promise<ChatDetailsDto> {
    const currentUserId = req.user['userId']; // ID do usuário autenticado
    const currentUserRole = req.user['role']; // Papel do usuário autenticado

    // Verificação de segurança: Apenas o cliente ou o provedor envolvido pode iniciar/encontrar este chat
    // Ou um ADMIN, dependendo da sua regra de negócio
    if (currentUserId !== clientId && currentUserId !== providerId && currentUserRole !== UserRole.ADMIN) {
        throw new ForbiddenException('Você não tem permissão para acessar este chat.');
    }

    // Se o usuário autenticado for um cliente, ele deve ser o clientId na requisição
    // Se o usuário autenticado for um provedor, ele deve ser o providerId na requisição
    // Essa validação garante que um usuário não pode criar chats arbitrários para outros.
    if (currentUserRole === UserRole.CLIENT && currentUserId !== clientId) {
        throw new ForbiddenException('Como cliente, você só pode iniciar chats para si mesmo.');
    }
    if (currentUserRole === UserRole.PROVIDER && currentUserId !== providerId) {
        throw new ForbiddenException('Como provedor, você só pode iniciar chats para si mesmo.');
    }


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
  @ApiResponse({ status: 404, description: 'Conversa não encontrada.' })
  async sendMessage(
    @Req() req: Request,
    @Param('chatId') chatId: string,
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<Message> {
    const senderId = req.user['userId']; // Assumindo que o userId está no payload do JWT
    // Aqui você pode adicionar lógica para verificar se o senderId tem permissão para enviar para este chatId
    return this.chatService.createMessage(
      chatId,
      senderId,
      sendMessageDto.receiverId,
      sendMessageDto.content,
    );
  }

  @Get(':chatId/messages')
  @ApiOperation({ summary: 'Obter mensagens de uma conversa específica' })
  @ApiResponse({
    status: 200,
    description: 'Lista de mensagens da conversa.',
    type: [Message],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada.' })
  async getMessages(
    @Req() req: Request,
    @Param('chatId') chatId: string,
    @Query() getMessagesDto: GetMessagesDto,
  ): Promise<Message[]> {
    const userId = req.user['userId']; // Para verificação de permissão

    // Em um cenário real, você verificaria se o userId é participante do chatId
    // Para isso, o ChatService precisaria de um método para verificar a participação no chat
    // Ex: const isParticipant = await this.chatService.isUserParticipantOfChat(chatId, userId);
    // if (!isParticipant) {
    //   throw new ForbiddenException('Você não tem acesso a esta conversa.');
    // }

    const offset = parseInt(getMessagesDto.offset, 10) || 0;
    const limit = parseInt(getMessagesDto.limit, 10) || 50;

    return this.chatService.getMessagesByChatId(chatId, offset, limit);
  }
}