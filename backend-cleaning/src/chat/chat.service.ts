// src/chat/chat.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Message, Prisma, Chat, BookingStatus } from '@prisma/client'; // Importe o tipo Message do Prisma, Prisma e Chat, e BookingStatus
import { Message as MessageEntity } from './entities/message.entity'; // Sua entidade customizada
import { ChatDetailsDto } from './dto/chat-details.dto'; // Importar o novo DTO

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Encontra um chat existente entre um cliente e um provedor, ou cria um novo.
   * Assume que existe um modelo 'Chat' no Prisma com participant1Id e participant2Id.
   */
  async findOrCreateChat(clientId: string, providerId: string): Promise<ChatDetailsDto> {
    this.logger.log(`[ChatService] findOrCreateChat: Buscando ou criando chat para clienteId=${clientId}, providerId=${providerId}`);

    // Primeiro, tente encontrar um chat existente entre esses dois participantes.
    // A ordem dos IDs pode variar, então precisamos verificar ambas as combinações.
    let chat = await this.prisma.chat.findFirst({
      where: {
        OR: [
          {
            participant1Id: clientId,
            participant2Id: providerId,
          },
          {
            participant1Id: providerId,
            participant2Id: clientId,
          },
        ],
      },
    });

    if (!chat) {
      // Se não encontrou, crie um novo chat.
      // Define participant1Id e participant2Id de forma consistente (ex: sempre o cliente como participant1).
      chat = await this.prisma.chat.create({
        data: {
          participant1Id: clientId, // Assumindo que clientId é sempre o primeiro participante
          participant2Id: providerId, // Assumindo que providerId é sempre o segundo participante
        },
      });
      this.logger.log(`[ChatService] findOrCreateChat: Novo chat criado com ID ${chat.id} entre ${clientId} e ${providerId}.`);
    } else {
      this.logger.log(`[ChatService] findOrCreateChat: Chat existente encontrado com ID ${chat.id}.`);
    }

    // Retorna os detalhes do chat, contendo apenas o chatId.
    return new ChatDetailsDto(chat.id);
  }


  async createMessage(
    chatId: string,
    senderId: string,
    receiverId: string,
    content: string,
  ): Promise<Message> {
    this.logger.log(`[ChatService] createMessage: Criando mensagem para chatId=${chatId}, senderId=${senderId}, receiverId=${receiverId}`);

    // Verifique se o chatId é válido e se os usuários são participantes do chat.
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { participant1Id: true, participant2Id: true } // Seleciona apenas os IDs dos participantes
    });

    if (!chat) {
      this.logger.error(`[ChatService] createMessage: Chat com ID ${chatId} não encontrado.`);
      throw new NotFoundException('Conversa não encontrada.');
    }

    // Verifica se o senderId e receiverId são participantes válidos e diferentes.
    const isSenderParticipant = chat.participant1Id === senderId || chat.participant2Id === senderId;
    const isReceiverParticipant = chat.participant1Id === receiverId || chat.participant2Id === receiverId;

    if (!isSenderParticipant || !isReceiverParticipant || senderId === receiverId) {
        this.logger.error(`[ChatService] createMessage: Invalid senderId (${senderId}) or receiverId (${receiverId}) for chatId ${chatId}. Participants: ${chat.participant1Id}, ${chat.participant2Id}`);
        throw new BadRequestException('Remetente ou destinatário não são participantes válidos desta conversa, ou são a mesma pessoa.');
    }

    // NOVO: Lógica de permissão de chat baseada no status do agendamento
    const participant1IsClient = await this.prisma.client.findUnique({ where: { userId: chat.participant1Id } });
    const participant2IsProvider = await this.prisma.provider.findUnique({ where: { userId: chat.participant2Id } });

    let clientId: string;
    let providerId: string;

    if (participant1IsClient && participant2IsProvider) {
      clientId = chat.participant1Id;
      providerId = chat.participant2Id;
    } else if (await this.prisma.provider.findUnique({ where: { userId: chat.participant1Id } }) && await this.prisma.client.findUnique({ where: { userId: chat.participant2Id } })) {
      clientId = chat.participant2Id;
      providerId = chat.participant1Id;
    } else {
      this.logger.error(`[ChatService] createMessage: Chat ${chatId} não é entre cliente e provedor.`);
      throw new ForbiddenException('Chat não é entre um cliente e um provedor válido.');
    }

    const activeBooking = await this.prisma.booking.findFirst({
      where: {
        clientId: clientId,
        providerId: providerId,
        status: BookingStatus.CONFIRMED, // Apenas agendamentos confirmados permitem chat
      },
    });

    if (!activeBooking) {
      // Verifica se há um agendamento COMPLETED ou CANCELED
      const completedOrCanceledBooking = await this.prisma.booking.findFirst({
        where: {
          clientId: clientId,
          providerId: providerId,
          OR: [
            { status: BookingStatus.COMPLETED },
            { status: BookingStatus.CANCELED },
          ],
        },
      });

      if (completedOrCanceledBooking) {
        this.logger.warn(`[ChatService] createMessage: Chat bloqueado para clientId=${clientId}, providerId=${providerId} devido a agendamento ${completedOrCanceledBooking.status}.`);
        throw new ForbiddenException('Não é possível enviar mensagens. O agendamento associado foi concluído ou cancelado.');
      } else {
        this.logger.warn(`[ChatService] createMessage: Chat bloqueado para clientId=${clientId}, providerId=${providerId} pois não há agendamento CONFIRMED.`);
        throw new ForbiddenException('Você só pode iniciar um chat após ter um agendamento confirmado.');
      }
    }


    // Cria a mensagem no banco de dados.
    const message = await this.prisma.message.create({
      data: {
        chatId,
        senderId,
        receiverId,
        content,
        timestamp: new Date(),
        isRead: false,
      },
    });
    this.logger.log(`[ChatService] createMessage: Mensagem criada com sucesso (ID: ${message.id}) para chatId ${chatId}.`);
    return message;
  }

  async getMessagesByChatId(
    chatId: string,
    offset: number = 0,
    limit: number = 50,
  ): Promise<Message[]> {
    this.logger.log(`[ChatService] getMessagesByChatId: Buscando mensagens para chatId=${chatId} com offset=${offset}, limit=${limit}`);

    // Opcional: Verificar permissões para acessar este chat.
    // Você precisaria de um método no ChatService para verificar se o usuário atual é participante.
    // Exemplo:
    // const userId = req.user['userId']; // Obter do request, se disponível
    // const isParticipant = await this.isUserParticipantOfChat(chatId, userId);
    // if (!isParticipant) {
    //   throw new ForbiddenException('Você não tem acesso a esta conversa.');
    // }

    // NOVO: Lógica de permissão de chat baseada no status do agendamento
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { participant1Id: true, participant2Id: true }
    });

    if (!chat) {
      this.logger.error(`[ChatService] getMessagesByChatId: Chat com ID ${chatId} não encontrado.`);
      throw new NotFoundException('Conversa não encontrada.');
    }

    const participant1IsClient = await this.prisma.client.findUnique({ where: { userId: chat.participant1Id } });
    const participant2IsProvider = await this.prisma.provider.findUnique({ where: { userId: chat.participant2Id } });

    let clientId: string;
    let providerId: string;

    if (participant1IsClient && participant2IsProvider) {
      clientId = chat.participant1Id;
      providerId = chat.participant2Id;
    } else if (await this.prisma.provider.findUnique({ where: { userId: chat.participant1Id } }) && await this.prisma.client.findUnique({ where: { userId: chat.participant2Id } })) {
      clientId = chat.participant2Id;
      providerId = chat.participant1Id;
    } else {
      this.logger.error(`[ChatService] getMessagesByChatId: Chat ${chatId} não é entre cliente e provedor.`);
      throw new ForbiddenException('Chat não é entre um cliente e um provedor válido.');
    }

    const activeBooking = await this.prisma.booking.findFirst({
      where: {
        clientId: clientId,
        providerId: providerId,
        status: BookingStatus.CONFIRMED, // Apenas agendamentos confirmados permitem chat
      },
    });

    if (!activeBooking) {
      // Verifica se há um agendamento COMPLETED ou CANCELED
      const completedOrCanceledBooking = await this.prisma.booking.findFirst({
        where: {
          clientId: clientId,
          providerId: providerId,
          OR: [
            { status: BookingStatus.COMPLETED },
            { status: BookingStatus.CANCELED },
          ],
        },
      });

      if (completedOrCanceledBooking) {
        this.logger.warn(`[ChatService] getMessagesByChatId: Acesso ao chat bloqueado para clientId=${clientId}, providerId=${providerId} devido a agendamento ${completedOrCanceledBooking.status}.`);
        throw new ForbiddenException('Não é possível acessar esta conversa. O agendamento associado foi concluído ou cancelado.');
      } else {
        this.logger.warn(`[ChatService] getMessagesByChatId: Acesso ao chat bloqueado para clientId=${clientId}, providerId=${providerId} pois não há agendamento CONFIRMED.`);
        throw new ForbiddenException('Você só pode acessar este chat após ter um agendamento confirmado.');
      }
    }


    // Busca as mensagens do chat, ordenadas por timestamp.
    const messages = await this.prisma.message.findMany({
      where: { chatId },
      orderBy: { timestamp: 'asc' }, // Ou 'desc' para as mais recentes primeiro
      skip: offset,
      take: limit,
      include: {
        sender: { select: { id: true, email: true, role: true, avatarUrl: true } }, // Inclui mais dados do remetente
        receiver: { select: { id: true, email: true, role: true, avatarUrl: true } }, // Inclui mais dados do destinatário
      },
    });
    this.logger.log(`[ChatService] getMessagesByChatId: Encontradas ${messages.length} mensagens para chatId ${chatId}.`);
    return messages;
  }

  // Método auxiliar para verificar se um usuário é participante de um chat (exemplo)
  // Este método seria útil para implementar a lógica de permissão em getMessagesByChatId e sendMessage.
  async isUserParticipantOfChat(chatId: string, userId: string): Promise<boolean> {
    this.logger.log(`[ChatService] isUserParticipantOfChat: Verificando se userId=${userId} é participante do chatId=${chatId}`);
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { participant1Id: true, participant2Id: true }
    });
    if (!chat) {
      this.logger.log(`[ChatService] isUserParticipantOfChat: Chat ${chatId} não encontrado.`);
      return false;
    }
    const isParticipant = chat.participant1Id === userId || chat.participant2Id === userId;
    this.logger.log(`[ChatService] isUserParticipantOfChat: Usuário ${userId} é participante do chat ${chatId}: ${isParticipant}`);
    return isParticipant;
  }
}