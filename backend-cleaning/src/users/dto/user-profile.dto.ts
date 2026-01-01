import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User, UserRole, Prisma, Referral, PricingType } from '@prisma/client';
import {
  ProviderServiceForFrontend,
  ServiceForFrontend,
} from '../../providers/providers.service';
import {
  IsString,
  IsEnum,
  IsDate,
  ValidateNested,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProviderDetailsDto } from '../../providers/dto/provider-details.dto';
import { UserWithIncludes } from '../users.service';

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

  @ApiProperty({
    description: 'ID do usuário associado',
    example: 'uuid-do-usuario',
  })
  userId: string;

  @ApiProperty({
    description: 'Nome completo do cliente',
    example: 'Maria da Silva',
  })
  fullName: string;

  @ApiPropertyOptional({
    description: 'Número de telefone do cliente',
    example: '11987654321',
  })
  phone: string | null;

  @ApiPropertyOptional({
    description: 'CPF do cliente',
    example: '123.456.789-00',
  })
  cpf: string | null;

  @ApiProperty({
    description: 'Data de criação do cliente',
    example: '2023-01-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do cliente',
    example: '2023-01-01T10:00:00.000Z',
  })
  updatedAt: Date;

  constructor(partial: Partial<ClientWithIncludes>) {
    Object.assign(this, partial);
  }
}

export class UserProfileDto {
  @ApiProperty({
    description: 'ID único do usuário',
    example: 'uuid-do-usuario',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Endereço de e-mail do usuário',
    example: 'usuario@example.com',
  })
  @IsString()
  email: string;

  @ApiPropertyOptional({
    description: 'URL do avatar do usuário',
    example: 'http://example.com/user_avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @ApiProperty({
    enum: UserRole,
    description: 'Papel do usuário na aplicação',
    example: UserRole.CLIENT,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'Data de criação do usuário',
    example: '2023-01-01T10:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do usuário',
    example: '2023-01-01T10:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Nome completo do usuário (do Client ou Provider associado)',
    example: 'João da Silva',
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Telefone do usuário (do Client ou Provider associado)',
    example: '11999999999',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    type: () => ClientDetailsDto,
    description: 'Detalhes do perfil do cliente',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClientDetailsDto)
  clientDetails?: ClientDetailsDto;

  @ApiPropertyOptional({
    type: () => ProviderDetailsDto,
    description: 'Detalhes do perfil do provedor',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProviderDetailsDto)
  providerDetails?: ProviderDetailsDto;

  @ApiPropertyOptional({
    description: 'Pontos de fidelidade do usuário',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  loyaltyPoints?: number | null;

  @ApiPropertyOptional({
    description: 'Indicações feitas pelo usuário',
    type: [String],
  })
  @IsOptional()
  referralsMade?: string[];

  @ApiPropertyOptional({
    description: 'Indicações recebidas pelo usuário',
    type: [String],
  })
  @IsOptional()
  referredBy?: string[];

  constructor(user: UserWithIncludes) {
    this.id = user.id;
    this.email = user.email;
    this.avatarUrl = user.avatarUrl;
    this.role = user.role;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;

    if (user.role === UserRole.CLIENT && user.client) {
      this.fullName = user.client.fullName;
      this.phone = user.client.phone;
      this.clientDetails = new ClientDetailsDto(user.client);
    } else if (user.role === UserRole.PROVIDER && user.provider) {
      this.fullName = user.provider.fullName;
      this.phone = user.provider.phone;

      // ✅ Helper: Decimal -> number (porque ProviderServiceForFrontend é number)
      const toNumber = (v: Prisma.Decimal | null | undefined): number => {
        if (!v) return 0;
        // Prisma.Decimal tem toNumber()
        return v.toNumber();
      };

      const toNumberOrNull = (
        v: Prisma.Decimal | null | undefined,
      ): number | null => {
        if (v == null) return null;
        return v.toNumber();
      };

      const toISOStringSafe = (d: unknown): string => {
        if (d instanceof Date) return d.toISOString();
        if (typeof d === 'string') return d; // caso já venha string em algum fluxo
        return new Date(d as any).toISOString();
      };

      const providerServicesConverted: ProviderServiceForFrontend[] = (
        user.provider.providerServices ?? []
      ).map((ps): ProviderServiceForFrontend => {
        const service: ServiceForFrontend = {
          id: ps.service.id,
          name: ps.service.name,
          description: ps.service.description ?? null,
          icon: ps.service.icon ?? null,
          defaultPricingType:
            ps.service.defaultPricingType ?? PricingType.FIXED_PRICE,
          price: toNumber(ps.service.price),
          createdAt: toISOStringSafe(ps.service.createdAt),
          updatedAt: toISOStringSafe(ps.service.updatedAt),
        };

        return {
          id: ps.id,
          providerId: ps.providerId,
          serviceId: ps.serviceId,

          price: toNumber(ps.price),
          pricePerHour: ps.pricePerHour,
          pricePerSquareMeter: toNumberOrNull(ps.pricePerSquareMeter),
          pricePerRoom: toNumberOrNull(ps.pricePerRoom),
          createdAt: toISOStringSafe(ps.createdAt),
          updatedAt: toISOStringSafe(ps.updatedAt),

          durationMinutes: ps.durationMinutes ?? null,
          description: ps.description ?? null,
          pricingType: ps.pricingType ?? PricingType.HOURLY,
          needsReview: ps.needsReview ?? false,

          service,
        };
      });

      const reviews = user.provider.reviewsReceived ?? [];
      const averageRating =
        reviews.length > 0
          ? Number(
              (
                reviews.reduce((sum, review) => sum + review.rating, 0) /
                reviews.length
              ).toFixed(1),
            )
          : 0;
      const reviewCount = reviews.length;

      const dateOfBirthString =
        user.provider.dateOfBirth instanceof Date
          ? user.provider.dateOfBirth.toISOString()
          : (user.provider.dateOfBirth as any);

      const createdAtString =
        user.provider.createdAt instanceof Date
          ? user.provider.createdAt.toISOString()
          : (user.provider.createdAt as any);

      const updatedAtString =
        user.provider.updatedAt instanceof Date
          ? user.provider.updatedAt.toISOString()
          : (user.provider.updatedAt as any);

      const providerExtras = user.provider as Record<string, unknown>;

      const documentPhotoFrontUrl =
        typeof providerExtras.documentPhotoFrontUrl === 'string'
          ? providerExtras.documentPhotoFrontUrl
          : null;
      const documentPhotoBackUrl =
        typeof providerExtras.documentPhotoBackUrl === 'string'
          ? providerExtras.documentPhotoBackUrl
          : null;
      const selfieWithDocumentUrl =
        typeof providerExtras.selfieWithDocumentUrl === 'string'
          ? providerExtras.selfieWithDocumentUrl
          : null;
      const rejectionReason =
        typeof providerExtras.rejectionReason === 'string'
          ? providerExtras.rejectionReason
          : null;
      const backgroundCheckResult = (providerExtras.backgroundCheckResult ??
        null) as Prisma.JsonValue | null;
      const ocrResult = (providerExtras.ocrResult ??
        null) as Prisma.JsonValue | null;
      const livenessResult = (providerExtras.livenessResult ??
        null) as Prisma.JsonValue | null;

      const providerCompletedBookingsCount =
        user.provider.bookings?.length ?? 0;

      const calculatedProvider: ProviderWithCalculatedRating = {
        ...user.provider,
        dateOfBirth: dateOfBirthString,
        createdAt: createdAtString,
        updatedAt: updatedAtString,
        providerServices: providerServicesConverted,
        email: user.email,
        averageRating,
        reviewCount,
        completedBookingsCount: providerCompletedBookingsCount,
        pixKey: user.provider.pixKey ?? null,
        pixKeyMasked: user.provider.pixKeyMasked ?? null,
        documentPhotoFrontUrl,
        documentPhotoBackUrl,
        selfieWithDocumentUrl,
        backgroundCheckResult,
        rejectionReason,
        ocrResult,
        livenessResult,
        user: {
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          fullName: user.fullName,
        },
      };

      this.providerDetails = new ProviderDetailsDto(calculatedProvider);
    }

    this.loyaltyPoints = user.loyalty?.currentPoints ?? null;

    this.referralsMade = user.referralsMade?.map((r: Referral) => r.id) ?? [];
    this.referredBy = user.referredBy?.map((r: Referral) => r.id) ?? [];
  }
}
