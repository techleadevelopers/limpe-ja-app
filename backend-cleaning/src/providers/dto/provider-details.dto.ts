// src/providers/dto/provider-details.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Provider, User, Address, ProviderService, Review, Service, UserRole, Client as PrismaClient, VerificationStatus } from '@prisma/client';
import { IsString, IsInt, IsBoolean, IsUrl, IsNumber, IsEmail, IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { CreateAddressDto } from '../../common/dto/create-address.dto';
import { Type } from 'class-transformer';
import { ProviderWithIncludes, ProviderWithCalculatedRating } from '../providers.service'; // <-- AGORA ProviderWithIncludes É EXPORTADO
import { ProviderServiceOfferingDto } from './provider-service-offering.dto';


export class ProviderReviewDto {
  @ApiProperty({ description: 'ID da avaliação', example: 'uuid-da-avaliacao' })
  id: string;

  @ApiProperty({ description: 'Classificação (estrelas)', example: 5 })
  rating: number;

  @ApiPropertyOptional({ description: 'Comentário da avaliação', example: 'Serviço excelente!' })
  comment?: string | null;

  @ApiProperty({ description: 'Nome do cliente que fez a avaliação', example: 'Laura Avaliadora' })
  reviewerName: string;

  @ApiProperty({ description: 'URL do avatar do cliente que fez a avaliação', example: 'http://example.com/client_avatar.jpg' })
  reviewerAvatarUrl?: string | null;

  @ApiProperty({ description: 'Data e hora da avaliação', example: '2023-10-26T10:00:00.000Z' })
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

  @ApiProperty({ description: 'Nome completo do provedor', example: 'Maria da Silva' })
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'Email do provedor', example: 'maria.silva@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'URL do avatar do provedor', example: 'http://example.com/avatar.jpg' })
  @IsOptional()
  @IsUrl()
  avatarUrl: string | null;

  @ApiPropertyOptional({ description: 'Anos de experiência do provedor', example: 5 })
  @IsOptional()
  @IsInt()
  yearsOfExperience: number | null;

  @ApiProperty({ enum: VerificationStatus, description: 'Status de verificação do provedor', example: VerificationStatus.APPROVED })
  @IsEnum(VerificationStatus)
  verificationStatus: VerificationStatus;

  @ApiPropertyOptional({ type: () => CreateAddressDto, description: 'Informações de endereço do provedor' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto | null;

  @ApiPropertyOptional({ description: 'Cidade do provedor', example: 'São Paulo' })
  @IsOptional()
  @IsString()
  city: string | null;

  @ApiPropertyOptional({ description: 'Estado do provedor', example: 'SP' })
  @IsOptional()
  @IsString()
  state: string | null;

  @ApiPropertyOptional({ description: 'Biografia do provedor', example: 'Profissional dedicada à limpeza...' })
  @IsOptional()
  @IsString()
  bio: string | null;

  @ApiPropertyOptional({ description: 'Média de avaliação do provedor', example: 4.5 })
  @IsOptional()
  @IsNumber()
  averageRating: number | null;

  @ApiPropertyOptional({ description: 'Total de avaliações recebidas', example: 120 })
  @IsOptional()
  @IsInt()
  reviewCount: number;

  @ApiProperty({ type: () => [ProviderServiceOfferingDto], description: 'Serviços oferecidos por este provedor' })
  @ValidateNested({ each: true })
  @Type(() => ProviderServiceOfferingDto)
  providerServices: ProviderServiceOfferingDto[];

  @ApiProperty({ type: () => [ProviderReviewDto], description: 'Lista de avaliações recebidas pelo provedor' })
  @ValidateNested({ each: true })
  @Type(() => ProviderReviewDto)
  reviews: ProviderReviewDto[];

  constructor(source: ProviderDetailsSource) {
    this.id = source.id;
    this.fullName = source.fullName;
    this.avatarUrl = source.avatarUrl;
    this.yearsOfExperience = source.yearsOfExperience;
    this.bio = source.bio;
    this.verificationStatus = source.verificationStatus;

    // Email já vem direto em ProviderWithCalculatedRating
    this.email = source.email;

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

    // Mapear os serviços oferecidos
    if (source.providerServices) {
      this.providerServices = source.providerServices.map(ps => new ProviderServiceOfferingDto(ps));
    } else {
      this.providerServices = [];
    }

    // Mapear as avaliações para ProviderReviewDto
    // ProviderWithCalculatedRating não tem reviewsReceived, então reviews será vazio ou precisará ser populado de outra forma
    // Se você precisa das reviews detalhadas aqui, o ProviderWithCalculatedRating precisaria incluí-las ou você buscar de outra fonte.
    // Assumindo que para o DTO de detalhes, as reviews já viriam populadas se necessário.
    this.reviews = []; // Por padrão, vazio, pois ProviderWithCalculatedRating não tem reviewsReceived
  }
}