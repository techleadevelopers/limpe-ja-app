// src/chat/chat.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Message, Prisma, Chat, BookingStatus } from '@prisma/client';
import { Message as MessageEntity } from './entities/message.entity';
import { ChatDetailsDto } from './dto/chat-details.dto';

export interface ConversationItem {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarUrl?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
}


@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private prisma: PrismaService) {}

  async findOrCreateChat(clientId: string, providerId: string): Promise<ChatDetailsDto> {
    this.logger.log(`[ChatService] findOrCreateChat: Buscando ou criando chat para clienteId=${clientId}, providerId=${providerId}`);

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
      chat = await this.prisma.chat.create({
        data: {
          participant1Id: clientId,
          participant2Id: providerId,
        },
      });
      this.logger.log(`[ChatService] findOrCreateChat: Novo chat criado com ID ${chat.id} entre ${clientId} e ${providerId}.`);
    } else {
      this.logger.log(`[ChatService] findOrCreateChat: Chat existente encontrado com ID ${chat.id}.`);
    }

    return new ChatDetailsDto(chat.id);
  }


  async createMessage(
    chatId: string,
    senderId: string,
    receiverId: string,
    content: string,
  ): Promise<Message> {
    this.logger.log(`[ChatService] createMessage: Criando mensagem para chatId=${chatId}, senderId=${senderId}, receiverId=${receiverId}`);

    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { participant1Id: true, participant2Id: true }
    });

    if (!chat) {
      this.logger.error(`[ChatService] createMessage: Chat com ID ${chatId} não encontrado.`);
      throw new NotFoundException('Conversa não encontrada.');
    }

    const isSenderParticipant = chat.participant1Id === senderId || chat.participant2Id === senderId;
    const isReceiverParticipant = chat.participant1Id === receiverId || chat.participant2Id === receiverId;

    if (!isSenderParticipant || !isReceiverParticipant || senderId === receiverId) {
        this.logger.error(`[ChatService] createMessage: Invalid senderId (${senderId}) or receiverId (${receiverId}) for chatId ${chatId}. Participants: ${chat.participant1Id}, ${chat.participant2Id}`);
        throw new BadRequestException('Remetente ou destinatário não são participantes válidos desta conversa, ou são a mesma pessoa.');
    }

    let clientUserId: string;
    let providerUserId: string;

    // Determina qual participante é o cliente e qual é o provedor (baseado nos User IDs)
    const participant1IsClientUser = await this.prisma.client.findUnique({ where: { userId: chat.participant1Id } });
    const participant2IsProviderUser = await this.prisma.provider.findUnique({ where: { userId: chat.participant2Id } });

    if (participant1IsClientUser && participant2IsProviderUser) {
      clientUserId = chat.participant1Id;
      providerUserId = chat.participant2Id;
    } else if (await this.prisma.provider.findUnique({ where: { userId: chat.participant1Id } }) && await this.prisma.client.findUnique({ where: { userId: chat.participant2Id } })) {
      clientUserId = chat.participant2Id;
      providerUserId = chat.participant1Id;
    } else {
      this.logger.error(`[ChatService] createMessage: Chat ${chatId} não é entre cliente e provedor válido (baseado em User IDs).`);
      throw new ForbiddenException('Chat não é entre um cliente e um provedor válido.');
    }

    // NOVO: Obter os IDs dos perfis de Cliente e Provedor a partir dos User IDs
    const clientProfile = await this.prisma.client.findUnique({
      where: { userId: clientUserId },
      select: { id: true }
    });
    const providerProfile = await this.prisma.provider.findUnique({
      where: { userId: providerUserId },
      select: { id: true }
    });

    if (!clientProfile || !providerProfile) {
      this.logger.error(`[ChatService] createMessage: Não foi possível encontrar perfis de cliente ou provedor para os IDs de usuário fornecidos.`);
      throw new BadRequestException('Não foi possível validar os participantes da conversa.');
    }

    const bookingClientId = clientProfile.id; // ID do perfil do cliente
    const bookingProviderId = providerProfile.id; // ID do perfil do provedor

    // Lógica de permissão de chat baseada no status do agendamento
    const activeBooking = await this.prisma.booking.findFirst({
      where: {
        clientId: bookingClientId, // Usar o ID do perfil do cliente
        providerId: bookingProviderId, // Usar o ID do perfil do provedor
        status: BookingStatus.CONFIRMED,
      },
    });

    if (!activeBooking) {
      const completedOrCanceledBooking = await this.prisma.booking.findFirst({
        where: {
          clientId: bookingClientId,
          providerId: bookingProviderId,
          OR: [
            { status: BookingStatus.COMPLETED },
            { status: BookingStatus.CANCELED },
          ],
        },
      });

      if (completedOrCanceledBooking) {
        this.logger.warn(`[ChatService] createMessage: Chat bloqueado para clientId=${bookingClientId}, providerId=${bookingProviderId} devido a agendamento ${completedOrCanceledBooking.status}.`);
        throw new ForbiddenException('Não é possível enviar mensagens. O agendamento associado foi concluído ou cancelado.');
      } else {
        this.logger.warn(`[ChatService] createMessage: Chat bloqueado para clientId=${bookingClientId}, providerId=${bookingProviderId} pois não há agendamento CONFIRMED.`);
        throw new ForbiddenException('Você só pode iniciar um chat após ter um agendamento confirmado.');
      }
    }

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

    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { participant1Id: true, participant2Id: true }
    });

    if (!chat) {
      this.logger.error(`[ChatService] getMessagesByChatId: Chat com ID ${chatId} não encontrado.`);
      throw new NotFoundException('Conversa não encontrada.');
    }

    let clientUserId: string;
    let providerUserId: string;

    const participant1IsClientUser = await this.prisma.client.findUnique({ where: { userId: chat.participant1Id } });
    const participant2IsProviderUser = await this.prisma.provider.findUnique({ where: { userId: chat.participant2Id } });

    if (participant1IsClientUser && participant2IsProviderUser) {
      clientUserId = chat.participant1Id;
      providerUserId = chat.participant2Id;
    } else if (await this.prisma.provider.findUnique({ where: { userId: chat.participant1Id } }) && await this.prisma.client.findUnique({ where: { userId: chat.participant2Id } })) {
      clientUserId = chat.participant2Id;
      providerUserId = chat.participant1Id;
    } else {
      this.logger.error(`[ChatService] getMessagesByChatId: Chat ${chatId} não é entre cliente e provedor válido (baseado em User IDs).`);
      throw new ForbiddenException('Chat não é entre um cliente e um provedor válido.');
    }

    // NOVO: Obter os IDs dos perfis de Cliente e Provedor a partir dos User IDs
    const clientProfile = await this.prisma.client.findUnique({
      where: { userId: clientUserId },
      select: { id: true }
    });
    const providerProfile = await this.prisma.provider.findUnique({
      where: { userId: providerUserId },
      select: { id: true }
    });

    if (!clientProfile || !providerProfile) {
      this.logger.error(`[ChatService] getMessagesByChatId: Não foi possível encontrar perfis de cliente ou provedor para os IDs de usuário fornecidos.`);
      throw new BadRequestException('Não foi possível validar os participantes da conversa.');
    }

    const bookingClientId = clientProfile.id; // ID do perfil do cliente
    const bookingProviderId = providerProfile.id; // ID do perfil do provedor

    const activeBooking = await this.prisma.booking.findFirst({
      where: {
        clientId: bookingClientId, // Usar o ID do perfil do cliente
        providerId: bookingProviderId, // Usar o ID do perfil do provedor
        status: BookingStatus.CONFIRMED,
      },
    });

    if (!activeBooking) {
      const completedOrCanceledBooking = await this.prisma.booking.findFirst({
        where: {
          clientId: bookingClientId,
          providerId: bookingProviderId,
          OR: [
            { status: BookingStatus.COMPLETED },
            { status: BookingStatus.CANCELED },
          ],
        },
      });

      if (completedOrCanceledBooking) {
        this.logger.warn(`[ChatService] getMessagesByChatId: Acesso ao chat bloqueado para clientId=${bookingClientId}, providerId=${bookingProviderId} devido a agendamento ${completedOrCanceledBooking.status}.`);
        throw new ForbiddenException('Não é possível acessar esta conversa. O agendamento associado foi concluído ou cancelado.');
      } else {
        this.logger.warn(`[ChatService] getMessagesByChatId: Acesso ao chat bloqueado para clientId=${bookingClientId}, providerId=${bookingProviderId} pois não há agendamento CONFIRMED.`);
        throw new ForbiddenException('Você só pode acessar este chat após ter um agendamento confirmado.');
      }
    }


    const messages = await this.prisma.message.findMany({
      where: { chatId },
      orderBy: { timestamp: 'asc' },
      skip: offset,
      take: limit,
      include: {
        sender: { select: { id: true, email: true, role: true, avatarUrl: true } },
        receiver: { select: { id: true, email: true, role: true, avatarUrl: true } },
      },
    });
    this.logger.log(`[ChatService] getMessagesByChatId: Encontradas ${messages.length} mensagens para chatId ${chatId}.`);
    return messages;
  }

  async getConversationsForUser(userId: string): Promise<ConversationItem[]> {
    this.logger.log(`[ChatService] getConversationsForUser: Buscando conversas para o usuário ${userId}`);

    type ChatWithRelations = Prisma.ChatGetPayload<{
      include: {
        messages: {
          orderBy: { timestamp: 'desc' };
          take: 1;
        };
        participant1: {
          select: {
            id: true;
            email: true;
            avatarUrl: true;
            client: { select: { fullName: true } };
            provider: { select: { fullName: true } };
          };
        };
        participant2: {
          select: {
            id: true;
            email: true;
            avatarUrl: true;
            client: { select: { fullName: true } };
            provider: { select: { fullName: true } };
          };
        };
      };
    }>;

    const chats: ChatWithRelations[] = await this.prisma.chat.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
        participant1: {
          select: {
            id: true,
            email: true,
            avatarUrl: true,
            client: { select: { fullName: true } },
            provider: { select: { fullName: true } },
          }
        },
        participant2: {
          select: {
            id: true,
            email: true,
            avatarUrl: true,
            client: { select: { fullName: true } },
            provider: { select: { fullName: true } },
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const conversationItems: ConversationItem[] = [];

    for (const chat of chats) {
      const otherParticipant = chat.participant1Id === userId ? chat.participant2 : chat.participant1;
      const lastMessage = chat.messages[0];

      let otherUserName: string | undefined;
      if (otherParticipant.client && otherParticipant.client.fullName) {
        otherUserName = otherParticipant.client.fullName;
      } else if (otherParticipant.provider && otherParticipant.provider.fullName) {
        otherUserName = otherParticipant.provider.fullName;
      } else {
        otherUserName = otherParticipant.email || 'Usuário Desconhecido';
      }

      const unreadCount = await this.prisma.message.count({
        where: {
          chatId: chat.id,
          receiverId: userId,
          isRead: false,
        },
      });

      if (otherParticipant) {
        conversationItems.push({
          id: chat.id,
          otherUserId: otherParticipant.id,
          otherUserName: otherUserName,
          otherUserAvatarUrl: otherParticipant.avatarUrl || undefined,
          lastMessage: lastMessage ? lastMessage.content : 'Nenhuma mensagem ainda.',
          lastMessageTimestamp: lastMessage ? lastMessage.timestamp.toISOString() : chat.createdAt.toISOString(),
          unreadCount: unreadCount,
        });
      }
    }

    this.logger.log(`[ChatService] getConversationsForUser: Encontradas ${conversationItems.length} conversas para o usuário ${userId}.`);
    return conversationItems;
  }

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