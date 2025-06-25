// src/providers/dto/provider-details.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Provider, User, Address, ProviderService, Review, Service, UserRole, Client as PrismaClient, VerificationStatus } from '@prisma/client';
import { IsString, IsInt, IsBoolean, IsUrl, IsNumber, IsEmail, IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { CreateAddressDto } from '../../common/dto/create-address.dto';
import { Type } from 'class-transformer';
import { ProviderWithIncludes, ProviderWithCalculatedRating } from '../providers.service';
import { ProviderServiceOfferingDto } from './provider-service-offering.dto'; // <<-- ADICIONAR ESTA LINHA


// =========================================================================
// NOVO: DTO para a estrutura de uma única avaliação (Review)
// Este DTO é aninhado dentro de ProviderDetailsDto
// =========================================================================
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
  reviewerAvatarUrl?: string | null; // Adicionado para o avatar do cliente

  @ApiProperty({ description: 'Data e hora da avaliação', example: '2023-10-26T10:00:00.000Z' })
  createdAt: Date; // Usar Date diretamente no DTO, será string ISO no JSON

  constructor(review: Review & { client: PrismaClient & { user: User } }) {
    this.id = review.id;
    this.rating = review.rating;
    this.comment = review.comment || null;
    this.reviewerName = review.client?.fullName || 'Cliente Anônimo';
    this.reviewerAvatarUrl = review.client?.user?.avatarUrl || null; // Pega o avatar do usuário do cliente
    this.createdAt = review.createdAt;
  }
}

type ProviderDetailsSource = ProviderWithIncludes | ProviderWithCalculatedRating;

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

  // === NOVO: Propriedade para as avaliações ===
  @ApiProperty({ type: () => [ProviderReviewDto], description: 'Lista de avaliações recebidas pelo provedor' })
  @ValidateNested({ each: true })
  @Type(() => ProviderReviewDto)
  reviews: ProviderReviewDto[];
  // === FIM DO NOVO ===

  constructor(source: ProviderDetailsSource) {
    this.id = source.id;
    this.fullName = source.fullName;
    this.avatarUrl = source.avatarUrl;
    this.yearsOfExperience = source.yearsOfExperience;
    this.bio = source.bio;
    this.verificationStatus = source.verificationStatus;

    if ('user' in source && source.user && source.user.email) {
      this.email = source.user.email;
    } else if ('email' in source) {
      this.email = source.email;
    } else {
      this.email = '';
    }

    if ('address' in source && source.address) {
      this.address = new CreateAddressDto();
      Object.assign(this.address, source.address);
      this.city = source.address.city || null;
      this.state = source.address.state || null;
    } else {
      this.address = null;
      this.city = null;
      this.state = null;
    }

    // Calcula averageRating e reviewCount
    if ('averageRating' in source) {
      this.averageRating = source.averageRating;
      this.reviewCount = source.reviewCount;
    } else if ('reviewsReceived' in source && source.reviewsReceived) { // Garante que reviewsReceived existe
      const reviews = source.reviewsReceived;
      this.reviewCount = reviews.length;
      if (reviews.length > 0) {
        const sumRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
        this.averageRating = parseFloat((sumRatings / reviews.length).toFixed(1));
      } else {
        this.averageRating = null;
      }
    } else {
      this.averageRating = null;
      this.reviewCount = 0;
    }

    // Mapear os serviços oferecidos
    if ('providerServices' in source && source.providerServices) {
      this.providerServices = source.providerServices.map(ps => new ProviderServiceOfferingDto(ps));
    } else {
      this.providerServices = [];
    }

    // === NOVO: Mapear as avaliações para ProviderReviewDto ===
    if ('reviewsReceived' in source && source.reviewsReceived) {
        // O cast `as` é necessário porque o tipo `Review` do Prisma
        // não inclui a relação `client.user` por padrão, mesmo que ela venha da consulta.
        // O construtor de ProviderReviewDto espera essa estrutura.
        this.reviews = source.reviewsReceived.map(review =>
            new ProviderReviewDto(review as Review & { client: PrismaClient & { user: User } })
        );
    } else {
        this.reviews = [];
    }
    // === FIM DO NOVO ===
  }
}