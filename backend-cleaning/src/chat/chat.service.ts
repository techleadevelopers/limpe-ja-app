// src/chat/chat.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Booking,
  Message,
  Chat,
  BookingStatus,
  PolicyEnforcement,
  PolicySource,
  UserRole,
  Prisma,
} from '@prisma/client';
import { Message as MessageEntity } from './entities/message.entity';
import { ChatDetailsDto } from './dto/chat-details.dto';
import { ContactLeakPolicyService } from '../common/services/contact-leak-policy.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface ConversationItem {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarUrl?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
}

export interface ConversationForBookingPayload {
  chatId: string;
  bookingId: string;
  providerId: string;
  providerUserId: string;
  providerFullName: string;
  providerAvatarUrl?: string | null;
  clientUserId: string;
}

const CHAT_ACTIVE_STATUSES: BookingStatus[] = [
  BookingStatus.CONFIRMED,
  BookingStatus.ON_THE_WAY,
  BookingStatus.ARRIVED,
  BookingStatus.STARTED,
];

const CHAT_FINAL_STATUSES: BookingStatus[] = [
  BookingStatus.FINISHED,
  BookingStatus.CANCELED,
  BookingStatus.EXPIRED,
  BookingStatus.REJECTED,
  BookingStatus.NO_SHOW,
];

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private contactLeakPolicyService: ContactLeakPolicyService,
    private notificationsService: NotificationsService,
  ) {}

  private async findBookingForChat(
    clientProfileId: string,
    providerProfileId: string,
  ): Promise<{
    activeBooking: Booking | null;
    finalizedBooking: Booking | null;
  }> {
    const activeBooking = await this.prisma.booking.findFirst({
      where: {
        clientId: clientProfileId,
        providerId: providerProfileId,
        status: { in: CHAT_ACTIVE_STATUSES },
      },
      orderBy: { updatedAt: 'desc' as Prisma.SortOrder },
    });

    if (activeBooking) {
      return { activeBooking, finalizedBooking: null };
    }

    const finalizedBooking = await this.prisma.booking.findFirst({
      where: {
        clientId: clientProfileId,
        providerId: providerProfileId,
        status: { in: CHAT_FINAL_STATUSES },
      },
      orderBy: { updatedAt: 'desc' as Prisma.SortOrder },
    });

    return { activeBooking: null, finalizedBooking };
  }

  async findOrCreateChat(
    clientId: string,
    providerId: string,
  ): Promise<ChatDetailsDto> {
    this.logger.log(
      `[ChatService] findOrCreateChat: Buscando ou criando chat para clienteId=${clientId}, providerId=${providerId}`,
    );

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
      this.logger.log(
        `[ChatService] findOrCreateChat: Novo chat criado com ID ${chat.id} entre ${clientId} e ${providerId}.`,
      );
    } else {
      this.logger.log(
        `[ChatService] findOrCreateChat: Chat existente encontrado com ID ${chat.id}.`,
      );
    }

    return new ChatDetailsDto(chat.id);
  }

  async getOrCreateConversationForBooking(
    bookingId: string,
    requesterUserId: string,
    requesterRole: UserRole,
  ): Promise<ConversationForBookingPayload> {
    this.logger.log(
      `[ChatService] getOrCreateConversationForBooking: bookingId=${bookingId} requester=${requesterUserId}`,
    );

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: { select: { userId: true } },
        provider: { include: { user: true } },
      },
    });

    if (!booking) {
      this.logger.warn(
        `[ChatService] getOrCreateConversationForBooking: booking ${bookingId} not found.`,
      );
      throw new NotFoundException('Agendamento não encontrado.');
    }

    const clientUserId = booking.client?.userId;
    const providerUserId = booking.provider?.userId;

    if (!clientUserId || !providerUserId) {
      throw new BadRequestException(
        'Dados do cliente ou provedor incompletos.',
      );
    }

    const isClient =
      requesterRole === UserRole.CLIENT && requesterUserId === clientUserId;
    const isProvider =
      requesterRole === UserRole.PROVIDER && requesterUserId === providerUserId;

    if (!isClient && !isProvider && requesterRole !== UserRole.ADMIN) {
      this.logger.warn(
        `[ChatService] getOrCreateConversationForBooking: requester ${requesterUserId} with role ${requesterRole} not allowed for booking ${bookingId}.`,
      );
      throw new ForbiddenException('Você não pode acessar este chat.');
    }

    if (!CHAT_ACTIVE_STATUSES.includes(booking.status)) {
      const reason = CHAT_FINAL_STATUSES.includes(booking.status)
        ? 'O chat está encerrado porque o agendamento foi concluído, cancelado ou expirado.'
        : 'O chat só está disponível para agendamentos confirmados ou em andamento.';
      this.logger.warn(
        `[ChatService] getOrCreateConversationForBooking: booking ${bookingId} status ${booking.status} not eligible.`,
      );
      throw new ForbiddenException(reason);
    }

    const chatDetails = await this.findOrCreateChat(
      clientUserId,
      providerUserId,
    );

    return {
      chatId: chatDetails.chatId,
      bookingId,
      providerId: booking.providerId,
      providerUserId,
      providerFullName: booking.provider?.fullName ?? 'Prestador',
      providerAvatarUrl: booking.provider?.user?.avatarUrl ?? null,
      clientUserId,
    };
  }

  async createMessage(
    chatId: string,
    senderId: string,
    receiverId: string,
    content: string,
  ): Promise<Message> {
    this.logger.log(
      `[ChatService] createMessage: Criando mensagem para chatId=${chatId}, senderId=${senderId}, receiverId=${receiverId}`,
    );

    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { participant1Id: true, participant2Id: true },
    });

    if (!chat) {
      this.logger.error(
        `[ChatService] createMessage: Chat com ID ${chatId} não encontrado.`,
      );
      throw new NotFoundException('Conversa não encontrada.');
    }

    const isSenderParticipant =
      chat.participant1Id === senderId || chat.participant2Id === senderId;
    const isReceiverParticipant =
      chat.participant1Id === receiverId || chat.participant2Id === receiverId;

    if (
      !isSenderParticipant ||
      !isReceiverParticipant ||
      senderId === receiverId
    ) {
      this.logger.error(
        `[ChatService] createMessage: Invalid senderId (${senderId}) or receiverId (${receiverId}) for chatId ${chatId}. Participants: ${chat.participant1Id}, ${chat.participant2Id}`,
      );
      throw new BadRequestException(
        'Remetente ou destinatário não são participantes válidos desta conversa, ou são a mesma pessoa.',
      );
    }

    let clientUserId: string;
    let providerUserId: string;

    // Determina qual participante é o cliente e qual é o provedor (baseado nos User IDs)
    const participant1IsClientUser = await this.prisma.client.findUnique({
      where: { userId: chat.participant1Id },
    });
    const participant2IsProviderUser = await this.prisma.provider.findUnique({
      where: { userId: chat.participant2Id },
    });

    if (participant1IsClientUser && participant2IsProviderUser) {
      clientUserId = chat.participant1Id;
      providerUserId = chat.participant2Id;
    } else if (
      (await this.prisma.provider.findUnique({
        where: { userId: chat.participant1Id },
      })) &&
      (await this.prisma.client.findUnique({
        where: { userId: chat.participant2Id },
      }))
    ) {
      clientUserId = chat.participant2Id;
      providerUserId = chat.participant1Id;
    } else {
      this.logger.error(
        `[ChatService] createMessage: Chat ${chatId} não é entre cliente e provedor válido (baseado em User IDs).`,
      );
      throw new ForbiddenException(
        'Chat não é entre um cliente e um provedor válido.',
      );
    }

    // NOVO: Obter os IDs dos perfis de Cliente e Provedor a partir dos User IDs
    const clientProfile = await this.prisma.client.findUnique({
      where: { userId: clientUserId },
      select: { id: true },
    });
    const providerProfileForBooking = await this.prisma.provider.findUnique({
      where: { userId: providerUserId },
      select: { id: true },
    });

    if (!clientProfile || !providerProfileForBooking) {
      this.logger.error(
        `[ChatService] createMessage: Não foi possível encontrar perfis de cliente ou provedor para os IDs de usuário fornecidos.`,
      );
      throw new BadRequestException(
        'Não foi possível validar os participantes da conversa.',
      );
    }

    const bookingClientId = clientProfile.id; // ID do perfil do cliente
    const bookingProviderId = providerProfileForBooking.id; // ID do perfil do provedor

    // Lógica de permissão de chat baseada no status do agendamento
    const { activeBooking, finalizedBooking } = await this.findBookingForChat(
      bookingClientId,
      bookingProviderId,
    );

    if (!activeBooking) {
      if (finalizedBooking) {
        this.logger.warn(
          `[ChatService] createMessage: Chat bloqueado para clientId=${bookingClientId}, providerId=${bookingProviderId} devido a agendamento ${finalizedBooking.status}.`,
        );
        throw new ForbiddenException(
          'Não é possível enviar mensagens. O agendamento associado foi concluído ou cancelado.',
        );
      }
      this.logger.warn(
        `[ChatService] createMessage: Chat bloqueado para clientId=${bookingClientId}, providerId=${bookingProviderId} pois não há agendamento CONFIRMED ou ativo.`,
      );
      throw new ForbiddenException(
        'Você só pode iniciar um chat após ter um agendamento confirmado ou em andamento.',
      );
    }

    const policyResult = await this.contactLeakPolicyService.evaluatePolicy({
      userId: senderId,
      content,
      chatId,
      bookingId: activeBooking?.id,
      source: PolicySource.CHAT,
    });

    if (policyResult?.enforcement === PolicyEnforcement.BLOCKED) {
      this.logger.warn(
        `[ChatService] createMessage: Bloqueio por política de contato para senderId=${senderId}`,
      );
      throw new ForbiddenException(
        'Sua mensagem foi bloqueada pela política de compartilhamento de contato.',
      );
    }

    if (policyResult?.enforcement === PolicyEnforcement.SANITIZED) {
      content = '***';
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
    const senderUser = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
      },
    });
    const providerProfile = await this.prisma.provider.findUnique({
      where: { id: activeBooking.providerId },
      select: {
        fullName: true,
        avatarUrl: true,
        userId: true,
      },
    });
    const receiverIsProvider = receiverId === providerUserId;
    const notificationPayload = {
      type: 'CHAT_MESSAGE',
      chatId,
      bookingId: activeBooking.id,
      senderId,
      senderFullName: senderUser?.fullName,
      senderAvatarUrl: senderUser?.avatarUrl,
      bookingProviderId: activeBooking.providerId,
      bookingClientId: activeBooking.clientId,
      providerUserId: providerProfile?.userId,
      providerFullName: providerProfile?.fullName,
      providerAvatarUrl: providerProfile?.avatarUrl,
    };
    const notificationMessage = senderUser?.fullName
      ? `${senderUser.fullName} enviou uma mensagem no chat.`
      : 'Você recebeu uma nova mensagem.';
    const targetUrl = receiverIsProvider
      ? `/provider/messages/${chatId}`
      : `/client/messages/${chatId}`;
    this.notificationsService
      .createNotification({
        userId: receiverId,
        type: 'CHAT_MESSAGE',
        title: 'Nova mensagem',
        message: notificationMessage,
        payload: notificationPayload,
        category: 'chat',
        relatedId: activeBooking.id,
        targetUrl,
      })
      .catch((err) =>
        this.logger.error(
          `[ChatService] Falha ao criar notificação de chat para ${receiverId}: ${
            err instanceof Error ? err.message : err
          }`,
          err instanceof Error ? err.stack : undefined,
        ),
      );
    this.logger.log(
      `[ChatService] createMessage: Mensagem criada com sucesso (ID: ${message.id}) para chatId ${chatId}.`,
    );
    return message;
  }

  async getMessagesByChatId(
    chatId: string,
    offset: number = 0,
    limit: number = 50,
  ): Promise<Message[]> {
    this.logger.log(
      `[ChatService] getMessagesByChatId: Buscando mensagens para chatId=${chatId} com offset=${offset}, limit=${limit}`,
    );

    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { participant1Id: true, participant2Id: true },
    });

    if (!chat) {
      this.logger.error(
        `[ChatService] getMessagesByChatId: Chat com ID ${chatId} não encontrado.`,
      );
      throw new NotFoundException('Conversa não encontrada.');
    }

    let clientUserId: string;
    let providerUserId: string;

    const participant1IsClientUser = await this.prisma.client.findUnique({
      where: { userId: chat.participant1Id },
    });
    const participant2IsProviderUser = await this.prisma.provider.findUnique({
      where: { userId: chat.participant2Id },
    });

    if (participant1IsClientUser && participant2IsProviderUser) {
      clientUserId = chat.participant1Id;
      providerUserId = chat.participant2Id;
    } else if (
      (await this.prisma.provider.findUnique({
        where: { userId: chat.participant1Id },
      })) &&
      (await this.prisma.client.findUnique({
        where: { userId: chat.participant2Id },
      }))
    ) {
      clientUserId = chat.participant2Id;
      providerUserId = chat.participant1Id;
    } else {
      this.logger.error(
        `[ChatService] getMessagesByChatId: Chat ${chatId} não é entre cliente e provedor válido (baseado em User IDs).`,
      );
      throw new ForbiddenException(
        'Chat não é entre um cliente e um provedor válido.',
      );
    }

    // NOVO: Obter os IDs dos perfis de Cliente e Provedor a partir dos User IDs
    const clientProfile = await this.prisma.client.findUnique({
      where: { userId: clientUserId },
      select: { id: true },
    });
    const providerProfileForBooking = await this.prisma.provider.findUnique({
      where: { userId: providerUserId },
      select: { id: true },
    });

    if (!clientProfile || !providerProfileForBooking) {
      this.logger.error(
        `[ChatService] getMessagesByChatId: Não foi possível encontrar perfis de cliente ou provedor para os IDs de usuário fornecidos.`,
      );
      throw new BadRequestException(
        'Não foi possível validar os participantes da conversa.',
      );
    }

    const bookingClientId = clientProfile.id; // ID do perfil do cliente
    const bookingProviderId = providerProfileForBooking.id; // ID do perfil do provedor

    const { activeBooking, finalizedBooking } = await this.findBookingForChat(
      bookingClientId,
      bookingProviderId,
    );

    if (!activeBooking) {
      if (finalizedBooking) {
        this.logger.warn(
          `[ChatService] getMessagesByChatId: Acesso ao chat bloqueado para clientId=${bookingClientId}, providerId=${bookingProviderId} devido a agendamento ${finalizedBooking.status}.`,
        );
        throw new ForbiddenException(
          'Não é possível acessar esta conversa. O agendamento associado foi concluído ou cancelado.',
        );
      }
      this.logger.warn(
        `[ChatService] getMessagesByChatId: Acesso ao chat bloqueado para clientId=${bookingClientId}, providerId=${bookingProviderId} pois não há agendamento CONFIRMED ou ativo.`,
      );
      throw new ForbiddenException(
        'Você só pode acessar este chat após ter um agendamento confirmado ou em andamento.',
      );
    }

    const messages = await this.prisma.message.findMany({
      where: { chatId },
      orderBy: { timestamp: 'asc' },
      skip: offset,
      take: limit,
      include: {
        sender: {
          select: { id: true, email: true, role: true, avatarUrl: true },
        },
        receiver: {
          select: { id: true, email: true, role: true, avatarUrl: true },
        },
      },
    });
    this.logger.log(
      `[ChatService] getMessagesByChatId: Encontradas ${messages.length} mensagens para chatId ${chatId}.`,
    );
    return messages;
  }

  async getConversationsForUser(userId: string): Promise<ConversationItem[]> {
    this.logger.log(
      `[ChatService] getConversationsForUser: Buscando conversas para o usuário ${userId}`,
    );

    type ChatWithRelations = Prisma.ChatGetPayload<{
      include: {
        messages: {
          orderBy: { timestamp: Prisma.SortOrder };
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
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
      include: {
        messages: {
          orderBy: { timestamp: 'desc' as Prisma.SortOrder },
          take: 1,
        },
        participant1: {
          select: {
            id: true,
            email: true,
            avatarUrl: true,
            client: { select: { fullName: true } },
            provider: { select: { fullName: true } },
          },
        },
        participant2: {
          select: {
            id: true,
            email: true,
            avatarUrl: true,
            client: { select: { fullName: true } },
            provider: { select: { fullName: true } },
          },
        },
      },
      orderBy: {
        createdAt: 'desc' as Prisma.SortOrder,
      },
    });

    const conversationItems: ConversationItem[] = [];

    for (const chat of chats) {
      const otherParticipant =
        chat.participant1Id === userId ? chat.participant2 : chat.participant1;
      const lastMessage = chat.messages[0];

      let otherUserName: string | undefined;
      if (otherParticipant.client && otherParticipant.client.fullName) {
        otherUserName = otherParticipant.client.fullName;
      } else if (
        otherParticipant.provider &&
        otherParticipant.provider.fullName
      ) {
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
          lastMessage: lastMessage
            ? lastMessage.content
            : 'Nenhuma mensagem ainda.',
          lastMessageTimestamp: lastMessage
            ? lastMessage.timestamp.toISOString()
            : chat.createdAt.toISOString(),
          unreadCount: unreadCount,
        });
      }
    }

    this.logger.log(
      `[ChatService] getConversationsForUser: Encontradas ${conversationItems.length} conversas para o usuário ${userId}.`,
    );
    return conversationItems;
  }

  async isUserParticipantOfChat(
    chatId: string,
    userId: string,
  ): Promise<boolean> {
    this.logger.log(
      `[ChatService] isUserParticipantOfChat: Verificando se userId=${userId} é participante do chatId=${chatId}`,
    );
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { participant1Id: true, participant2Id: true },
    });
    if (!chat) {
      this.logger.log(
        `[ChatService] isUserParticipantOfChat: Chat ${chatId} não encontrado.`,
      );
      return false;
    }
    const isParticipant =
      chat.participant1Id === userId || chat.participant2Id === userId;
    this.logger.log(
      `[ChatService] isUserParticipantOfChat: Usuário ${userId} é participante do chat ${chatId}: ${isParticipant}`,
    );
    return isParticipant;
  }
}
