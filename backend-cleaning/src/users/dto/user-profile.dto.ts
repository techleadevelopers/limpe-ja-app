import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User, UserRole, Prisma, Loyalty, Referral } from '@prisma/client'; // Importe Referral do schema
import { IsString, IsEnum, IsDate, ValidateNested, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ProviderDetailsDto } from '../../providers/dto/provider-details.dto';
import { UserWithIncludes } from '../users.service'; // CORRIGIDO: Importe o type do service

// === TIPOS DE SERVIÇO (MANTIDOS) ===
import { ProviderWithCalculatedRating } from '../../providers/providers.service';

// Definição de ClientWithIncludes (alinhado ao schema: campos em Client)
import { Address, Booking, Review } from '@prisma/client';

export type ClientWithIncludes = {
  id: string;
  userId: string;
  fullName: string;
  phone: string | null;
  cpf: string | null;
  dateOfBirth?: Date | null;
  completedBookingsCount: number;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  address: Address | null;
  bookings: Booking[];
  reviewsMade: Review[];
  noShowCount: number;
  cancellationCount: number;
  _count?: { bookings: number };
};

// ClientDetailsDto (sem loyaltyPoints, do schema)
export class ClientDetailsDto {
  @ApiProperty({ description: 'ID do cliente', example: 'uuid-do-cliente' })
  id: string;

  @ApiProperty({ description: 'ID do usuário associado', example: 'uuid-do-usuario' })
  userId: string;

  @ApiProperty({ description: 'Nome completo do cliente', example: 'Maria da Silva' })
  fullName: string;

  @ApiPropertyOptional({ description: 'Número de telefone do cliente', example: '11987654321' })
  phone: string | null;

  @ApiPropertyOptional({ description: 'CPF do cliente', example: '123.456.789-00' })
  cpf: string | null;

  @ApiProperty({ description: 'Data de criação do cliente', example: '2023-01-01T10:00:00.000Z' })
  createdAt: Date; 

  @ApiProperty({ description: 'Data da última atualização do cliente', example: '2023-01-01T10:00:00.000Z' })
  updatedAt: Date; 

  constructor(partial: Partial<ClientWithIncludes>) {
    Object.assign(this, partial);
  }
}

export class UserProfileDto {
  @ApiProperty({ description: 'ID único do usuário', example: 'uuid-do-usuario' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Endereço de e-mail do usuário', example: 'usuario@example.com' })
  @IsString()
  email: string;

  @ApiPropertyOptional({ description: 'URL do avatar do usuário', example: 'http://example.com/user_avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @ApiProperty({ enum: UserRole, description: 'Papel do usuário na aplicação', example: UserRole.CLIENT })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ description: 'Data de criação do usuário', example: '2023-01-01T10:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização do usuário', example: '2023-01-01T10:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Nome completo do usuário (do Client ou Provider associado)', example: 'João da Silva' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Telefone do usuário (do Client ou Provider associado)', example: '11999999999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ type: () => ClientDetailsDto, description: 'Detalhes do perfil do cliente' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClientDetailsDto)
  clientDetails?: ClientDetailsDto;

  @ApiPropertyOptional({ type: () => ProviderDetailsDto, description: 'Detalhes do perfil do provedor' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProviderDetailsDto)
  providerDetails?: ProviderDetailsDto;

  @ApiPropertyOptional({ description: 'Pontos de fidelidade do usuário', example: 100 })
  @IsOptional()
  @IsNumber()
  loyaltyPoints?: number | null;

  // CORRIGIDO: Suporte a indicações do schema (Referral[])
  @ApiPropertyOptional({ description: 'Indicações feitas pelo usuário', type: [String] })
  @IsOptional()
  referralsMade?: string[]; // IDs de Referral

  @ApiPropertyOptional({ description: 'Indicações recebidas pelo usuário', type: [String] })
  @IsOptional()
  referredBy?: string[]; // CORRIGIDO: 'referredBy' do schema (IDs de Referral recebidas)

  constructor(user: UserWithIncludes) { // Tipado com includes
    this.id = user.id;
    this.email = user.email;
    this.avatarUrl = user.avatarUrl;
    this.role = user.role;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;

    // Fallbacks para opcionais (do schema)
    if (user.role === UserRole.CLIENT && user.client) {
      this.fullName = user.client.fullName;
      this.phone = user.client.phone;
      this.clientDetails = new ClientDetailsDto(user.client);
    } else if (user.role === UserRole.PROVIDER && user.provider) {
      this.fullName = user.provider.fullName; // Do schema: fullName em Provider
      this.phone = user.provider.phone;

      // === CORREÇÃO: Função utilitária para converter Prisma.Decimal para number ===
      // O erro ocorre porque DTOs de frontend esperam 'number', mas o Prisma retorna 'Decimal'.
      const convertDecimalToNumber = (decimalValue: Prisma.Decimal | null | undefined): number | null => {
        if (decimalValue && decimalValue instanceof Prisma.Decimal) {
            // Usa .toNumber() para conversão segura
            return decimalValue.toNumber();
        }
        return null;
      };

      // 1. Converte os 'providerServices', garantindo que todos os campos Decimal sejam number
      const providerServicesConverted = user.provider.providerServices?.map(ps => {
          const pricePerSquareMeter = convertDecimalToNumber(ps.pricePerSquareMeter) ?? 0;
          const pricePerRoom = convertDecimalToNumber(ps.pricePerRoom) ?? 0;

          // Conversão do preço do Service aninhado (agora opcional)
          const baseServicePrice = convertDecimalToNumber(ps.service?.price) ?? 0;

          return {
              ...ps,
              // Campos ProviderService (conversão)
              pricePerSquareMeter,
              pricePerRoom,
              
              // Service aninhado (conversão do preço base)
              service: ps.service ? { ...ps.service, price: baseServicePrice } as any : (ps.service as any),
          };
      }) || []; // Retorna array vazio se não houver serviços

      // 2. Calcular propriedades ausentes
      const reviews = user.provider.reviewsReceived || [];
      const averageRating = reviews.length > 0 ? parseFloat((reviews.reduce((sum, r) => sum + (r as any).rating, 0) / reviews.length).toFixed(1)) : 0;
      const reviewCount = reviews.length;

      // 3. Mapeamento para ProviderWithCalculatedRating (usando os serviços convertidos)
      
      // NOVO: Converte dateOfBirth para string (ISO) se for um objeto Date
      const dateOfBirthString = user.provider.dateOfBirth instanceof Date
        ? user.provider.dateOfBirth.toISOString()
        : user.provider.dateOfBirth; // Mantém null ou string se já for

      // NOVO: Converte createdAt para string (ISO)
      const createdAtString = user.provider.createdAt instanceof Date
        ? user.provider.createdAt.toISOString()
        : user.provider.createdAt;

      // NOVO: Converte updatedAt para string (ISO)
      const updatedAtString = user.provider.updatedAt instanceof Date
        ? user.provider.updatedAt.toISOString()
        : user.provider.updatedAt;


      const calculatedProvider: ProviderWithCalculatedRating = {
        ...user.provider,
        
        // CORREÇÃO DO ERRO 2352: Sobrescreve dateOfBirth, createdAt e updatedAt
        dateOfBirth: dateOfBirthString,
        createdAt: createdAtString,
        updatedAt: updatedAtString,

        // Sobrescreve 'providerServices' com a nova estrutura 'number'
        providerServices: providerServicesConverted as any, // 'as any' para forçar a compatibilidade de tipo após a conversão Decimal -> number

        email: user.email, // Email vem do User principal
        averageRating,
        reviewCount,
        // Campos obrigatórios que podem não estar presentes no select original
        pixKey: (user.provider as any).pixKey ?? null,
        pixKeyMasked: (user.provider as any).pixKeyMasked ?? null,
        documentPhotoFrontUrl: (user.provider as any).documentPhotoFrontUrl ?? null,
        documentPhotoBackUrl: (user.provider as any).documentPhotoBackUrl ?? null,
        selfieWithDocumentUrl: (user.provider as any).selfieWithDocumentUrl ?? null,
        backgroundCheckResult: (user.provider as any).backgroundCheckResult ?? null,
        rejectionReason: (user.provider as any).rejectionReason ?? null,
        ocrResult: (user.provider as any).ocrResult ?? null,
        livenessResult: (user.provider as any).livenessResult ?? null,
        // Outros campos calculados/ausentes (como address, city, state, etc., que vêm do spread)
        user: {
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          fullName: user.fullName,
        },
      } as ProviderWithCalculatedRating; // Type assertion para resolver o erro de tipo de nível superior

      this.providerDetails = new ProviderDetailsDto(calculatedProvider);
    }

    this.loyaltyPoints = user.loyalty?.currentPoints ?? null; // Do schema: currentPoints em Loyalty

    // CORRIGIDO: Mapeamento de referrals do schema
    this.referralsMade = user.referralsMade?.map((r: Referral) => r.id) ?? [];
    this.referredBy = user.referredBy?.map((r: Referral) => r.id) ?? [];
  }
}
