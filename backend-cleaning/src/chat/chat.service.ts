// src/chat/chat.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// Importe Prisma para usar Prisma.ChatGetPayload
import { Message, Prisma, Chat, BookingStatus } from '@prisma/client';
import { Message as MessageEntity } from './entities/message.entity'; // Sua entidade customizada
import { ChatDetailsDto } from './dto/chat-details.dto'; // Importar o novo DTO

// Interface para um item de conversa (para o frontend)
export interface ConversationItem {
  id: string; // Este é o seu chatId
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
      clientId = chat.participant2Id; // CORRIGIDO: Era chat.capitalizedId
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
      clientId = chat.participant2Id; // CORRIGIDO: Era chat.capitalizedId
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

  /**
   * Busca a lista de conversas para um usuário logado.
   * Este método corresponde ao endpoint GET /chat/me/conversations.
   * @param userId ID do usuário logado.
   * @returns Promessa com um array de ConversationItem.
   */
  async getConversationsForUser(userId: string): Promise<ConversationItem[]> {
    this.logger.log(`[ChatService] getConversationsForUser: Buscando conversas para o usuário ${userId}`);

    // Definir o tipo explícito para o resultado da query findMany
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
          take: 1, // Pega apenas a última mensagem
        },
        participant1: { // Inclui dados do participante 1
          select: {
            id: true,
            email: true,
            avatarUrl: true,
            client: { select: { fullName: true } }, // Inclui fullName se for um cliente
            provider: { select: { fullName: true } }, // Inclui fullName se for um provedor
          }
        },
        participant2: { // Inclui dados do participante 2
          select: {
            id: true,
            email: true,
            avatarUrl: true,
            client: { select: { fullName: true } }, // Inclui fullName se for um cliente
            provider: { select: { fullName: true } }, // Inclui fullName se for um provedor
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // Agora 'createdAt' deve existir no modelo Chat
      }
    });

    const conversationItems: ConversationItem[] = [];

    for (const chat of chats) {
      // Determine the other participant
      // The `include` makes `participant1` and `participant2` full User objects,
      // including their nested client/provider relations if they exist.
      const otherParticipant = chat.participant1Id === userId ? chat.participant2 : chat.participant1;
      const lastMessage = chat.messages[0]; // 'messages' agora é reconhecido

      // Determine the other participant's name
      let otherUserName: string | undefined;
      // Check if the related client or provider exists and has a fullName
      if (otherParticipant.client && otherParticipant.client.fullName) {
        otherUserName = otherParticipant.client.fullName;
      } else if (otherParticipant.provider && otherParticipant.provider.fullName) {
        otherUserName = otherParticipant.provider.fullName;
      } else {
        otherUserName = otherParticipant.email || 'Usuário Desconhecido'; // Fallback to email if no full name found
      }

      // Contar mensagens não lidas para o usuário logado
      const unreadCount = await this.prisma.message.count({
        where: {
          chatId: chat.id,
          receiverId: userId, // Mensagens destinadas ao usuário logado
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
          // 'createdAt' agora é reconhecido no objeto chat
          lastMessageTimestamp: lastMessage ? lastMessage.timestamp.toISOString() : chat.createdAt.toISOString(),
          unreadCount: unreadCount,
        });
      }
    }

    this.logger.log(`[ChatService] getConversationsForUser: Encontradas ${conversationItems.length} conversas para o usuário ${userId}.`);
    return conversationItems;
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