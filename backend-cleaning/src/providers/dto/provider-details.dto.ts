// src/providers/dto/provider-details.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Review,
  Client as PrismaClient,
  VerificationStatus,
  User,
} from '@prisma/client';
import {
  IsString,
  IsInt,
  IsUrl,
  IsNumber,
  IsEmail,
  IsOptional,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { CreateAddressDto } from '../../common/dto/create-address.dto';
import { Type } from 'class-transformer';
import {
  ProviderWithIncludes,
  ProviderWithCalculatedRating,
} from '../providers.service'; // <-- AGORA ProviderWithIncludes É EXPORTADO
import { ProviderServiceOfferingDto } from './provider-service-offering.dto';

export class ProviderReviewDto {
  @ApiProperty({ description: 'ID da avaliação', example: 'uuid-da-avaliacao' })
  id: string;

  @ApiProperty({ description: 'Classificação (estrelas)', example: 5 })
  rating: number;

  @ApiPropertyOptional({
    description: 'Comentário da avaliação',
    example: 'Serviço excelente!',
  })
  comment?: string | null;

  @ApiProperty({
    description: 'Nome do cliente que fez a avaliação',
    example: 'Laura Avaliadora',
  })
  reviewerName: string;

  @ApiProperty({
    description: 'URL do avatar do cliente que fez a avaliação',
    example: 'http://example.com/client_avatar.jpg',
  })
  reviewerAvatarUrl?: string | null;

  @ApiProperty({
    description: 'Data e hora da avaliação',
    example: '2023-10-26T10:00:00.000Z',
  })
  createdAt: Date;

  constructor(review: Review & { client: PrismaClient & { user: User } }) {
    this.id = review.id;
    this.rating = review.rating;
    this.comment = review.comment || null;
    this.reviewerName = review.client?.fullName || 'Cliente Anônimo';
    this.reviewerAvatarUrl = review.client?.user?.avatarUrl || null;
    this.createdAt = review.createdAt;
  }
}

type ProviderDetailsSource = ProviderWithCalculatedRating; // <-- AQUI USAMOS APENAS ProviderWithCalculatedRating, pois este DTO é para o frontend

export class ProviderDetailsDto {
  @ApiProperty({ description: 'ID do provedor', example: 'uuid-do-provedor' })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Nome completo do provedor',
    example: 'Maria da Silva',
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    description: 'Email do provedor',
    example: 'maria.silva@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'URL do avatar do provedor',
    example: 'http://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsUrl()
  avatarUrl: string | null;

  @ApiPropertyOptional({
    description: 'Telefone do provedor',
    example: '+5511999999999',
  })
  @IsOptional()
  @IsString()
  phone: string | null;

  @ApiPropertyOptional({
    description: 'Anos de experiência do provedor',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  yearsOfExperience: number | null;

  @ApiPropertyOptional({
    enum: VerificationStatus,
    description:
      'Status de verificação do provedor (opcional para selo nos cards)',
    example: VerificationStatus.APPROVED,
  }) // NOVO: Opcional para relatório
  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @ApiPropertyOptional({
    type: () => CreateAddressDto,
    description: 'Informações de endereço do provedor',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto | null;

  @ApiPropertyOptional({
    description: 'Cidade do provedor',
    example: 'São Paulo',
  })
  @IsOptional()
  @IsString()
  city: string | null;

  @ApiPropertyOptional({ description: 'Estado do provedor', example: 'SP' })
  @IsOptional()
  @IsString()
  state: string | null;

  @ApiPropertyOptional({
    description: 'Biografia do provedor',
    example: 'Profissional dedicada à limpeza...',
  })
  @IsOptional()
  @IsString()
  bio: string | null;

  @ApiPropertyOptional({
    description: 'Média de avaliação do provedor',
    example: 4.5,
  })
  @IsOptional()
  @IsNumber()
  averageRating: number | null;

  @ApiPropertyOptional({
    description: 'Total de avaliações recebidas',
    example: 120,
  })
  @IsOptional()
  @IsInt()
  reviewCount: number;

  @ApiProperty({
    description: 'Data de criaA§ALo do cadastro',
    example: '2025-01-01T12:00:00.000Z',
  })
  @IsString()
  createdAt: string;

  @ApiProperty({
    description: 'Data da Aoltima atualizaA§ALo',
    example: '2025-01-02T12:00:00.000Z',
  })
  @IsString()
  updatedAt: string;

  @ApiPropertyOptional({
    type: () => [String],
    description: 'Badges do provedor (opcional para exibição)',
    example: ['TOP_RATED', 'VERIFIED'],
  }) // NOVO: Opcional para badges
  @IsOptional()
  badges?: string[];

  @ApiProperty({
    type: () => [ProviderServiceOfferingDto],
    description: 'Serviços oferecidos por este provedor',
  })
  @ValidateNested({ each: true })
  @Type(() => ProviderServiceOfferingDto)
  providerServices: ProviderServiceOfferingDto[];

  @ApiProperty({
    type: () => [ProviderReviewDto],
    description: 'Lista de avaliações recebidas pelo provedor',
  })
  @ValidateNested({ each: true })
  @Type(() => ProviderReviewDto)
  reviews: ProviderReviewDto[];

  // NOVAS PROPRIEDADES (alinhado com relatório: opcionais para métricas mini e chip horário)
  @ApiPropertyOptional({
    description: 'Taxa de aceitação de agendamentos do provedor (em %)',
    example: 90,
  })
  @IsOptional()
  @IsNumber()
  acceptanceRate?: number;

  @ApiPropertyOptional({
    description: 'Tempo médio de resposta do provedor (em minutos)',
    example: 15,
  })
  @IsOptional()
  @IsInt()
  averageResponseTime?: number;

  @ApiPropertyOptional({
    description: 'Próximo horário disponível (opcional para chip nos cards)',
    example: { date: '2025-09-29', time: '09:00' },
  }) // NOVO: Para chip de horário
  @IsOptional()
  nextAvailable?: { date: string; time: string };

  // CORREÇÃO: Adicionado distance (em metros, calculado via PostGIS se lat/lng fornecidos)
  @ApiPropertyOptional({
    description:
      'Distância em metros do provedor (calculada se lat/lng do cliente fornecidos; front formata pra km)',
    example: 4200,
  })
  @IsOptional()
  @IsNumber()
  distance?: number;

  constructor(source: ProviderDetailsSource) {
    this.id = source.id;
    this.fullName = source.fullName;
    this.avatarUrl = source.avatarUrl;
    this.phone = source.phone ?? source.user?.phone ?? null;
    this.yearsOfExperience = source.yearsOfExperience;
    this.bio = source.bio;
    this.verificationStatus = source.verificationStatus; // NOVO

    // Email já vem direto em ProviderWithCalculatedRating
    this.email = source.email;
    this.createdAt = source.createdAt;
    this.updatedAt = source.updatedAt;

    if (source.address) {
      this.address = new CreateAddressDto();
      Object.assign(this.address, source.address);
      this.city = source.address.city || null;
      this.state = source.address.state || null;
    } else {
      this.address = null;
      this.city = null;
      this.state = null;
    }

    // averageRating e reviewCount já vêm calculados em ProviderWithCalculatedRating
    this.averageRating = source.averageRating;
    this.reviewCount = source.reviewCount;

    // NOVO: Badges opcionais
    this.badges = source.badges;

    // Mapear os serviços oferecidos
    if (source.providerServices) {
      this.providerServices = source.providerServices.map(
        (ps) => new ProviderServiceOfferingDto(ps),
      );
    } else {
      this.providerServices = [];
    }

    // Mapear as avaliações para ProviderReviewDto
    // ProviderWithCalculatedRating não tem reviewsReceived, então reviews será vazio ou precisará ser populado de outra forma
    // Se você precisa das reviews detalhadas aqui, o ProviderWithCalculatedRating precisaria incluí-las ou você buscar de outra fonte.
    // Assumindo que para o DTO de detalhes, as reviews já viriam populadas se necessário.
    this.reviews = []; // Por padrão, vazio, pois ProviderWithCalculatedRating não tem reviewsReceived

    // Atribuir as novas propriedades (opcionais, alinhado com relatório)
    this.acceptanceRate = source.acceptanceRate;
    this.averageResponseTime = source.averageResponseTime;
    this.nextAvailable = source.nextAvailable; // NOVO

    // CORREÇÃO: Atribui distance (em metros, opcional)
    this.distance = source.distance || undefined;
  }
}
