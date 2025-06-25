// src/chat/chat.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Message, Prisma } from '@prisma/client'; // Importe o tipo Message do Prisma e Prisma para Decimal
import { Message as MessageEntity } from './entities/message.entity'; // Sua entidade customizada
import { ChatDetailsDto } from './dto/chat-details.dto'; // Importar o novo DTO

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  /**
   * Encontra um chat existente entre um cliente e um provedor, ou cria um novo.
   * Assume que existe um modelo 'Chat' no Prisma para representar as conversas.
   * Se você não tem um modelo 'Chat' e usa apenas 'Message' com 'chatId',
   * você precisará adaptar esta lógica para gerenciar 'chatId' de forma diferente.
   * Por simplicidade, vamos assumir um modelo 'Chat' que contém os participantes.
   */
  async findOrCreateChat(clientId: string, providerId: string): Promise<ChatDetailsDto> {
    // Primeiro, tente encontrar um chat existente entre esses dois participantes
    // A ordem dos IDs pode variar, então precisamos verificar ambas as combinações
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
      // Se não encontrou, crie um novo chat
      // Você pode definir qual ID é participant1 e qual é participant2 de forma consistente
      // Ex: sempre o clientId como participant1Id e providerId como participant2Id
      chat = await this.prisma.chat.create({
        data: {
          participant1Id: clientId, // Assumindo que clientId é sempre o primeiro participante
          participant2Id: providerId, // Assumindo que providerId é sempre o segundo participante
        },
      });
      console.log(`Novo chat criado entre cliente ${clientId} e provedor ${providerId}.`);
    } else {
      console.log(`Chat existente encontrado entre cliente ${clientId} e provedor ${providerId}.`);
    }

    return new ChatDetailsDto(chat.id);
  }


  async createMessage(
    chatId: string,
    senderId: string,
    receiverId: string,
    content: string,
  ): Promise<Message> {
    // Opcional: Verificar se o chatId é válido ou se os usuários podem conversar
    // Você DEVE ter um modelo de Chat ou Conversation no Prisma para isso
    const chatExists = await this.prisma.chat.findUnique({ where: { id: chatId } });
    if (!chatExists) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    // Adicionar validação para garantir que senderId e receiverId são participantes do chat
    if (![chatExists.participant1Id, chatExists.participant2Id].includes(senderId) ||
        ![chatExists.participant1Id, chatExists.participant2Id].includes(receiverId) ||
        senderId === receiverId // Não pode enviar mensagem para si mesmo
    ) {
        throw new BadRequestException('Remetente ou destinatário não são participantes válidos desta conversa.');
    }


    return this.prisma.message.create({
      data: {
        chatId,
        senderId,
        receiverId,
        content,
        timestamp: new Date(),
        isRead: false,
      },
    });
  }

  async getMessagesByChatId(
    chatId: string,
    offset: number = 0,
    limit: number = 50,
  ): Promise<Message[]> {
    // Opcional: Verificar permissões para acessar este chat
    // const chat = await this.prisma.chat.findUnique({ where: { id: chatId }, include: { participants: true } });
    // if (!chat || !chat.participants.some(p => p.userId === currentUserId)) {
    //   throw new ForbiddenException('Você não tem acesso a esta conversa.');
    // }

    return this.prisma.message.findMany({
      where: { chatId },
      orderBy: { timestamp: 'asc' }, // Ou 'desc' para as mais recentes primeiro
      skip: offset,
      take: limit,
      include: {
        sender: { select: { id: true, email: true } }, // Inclui dados básicos do remetente
        receiver: { select: { id: true, email: true } }, // Inclui dados básicos do destinatário
      },
    });
  }
}