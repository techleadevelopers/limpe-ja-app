// src/clients/dto/client-details.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Client, User, Address } from '@prisma/client'; // Certifique-se de que 'Address' está importado aqui
import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAddressDto } from '../../common/dto/create-address.dto'; // Usando CreateAddressDto para o address

// CORREÇÃO FINAL: Tipo para o Client com as relações que o UserProfileDto espera.
// Usamos o tipo 'Client' diretamente do Prisma que JÁ INCLUI createdAt e updatedAt (após a modificação no schema)
// e adicionamos apenas as relações que vêm do 'include' da consulta.
type ClientWithRelationsForDto = Client & {
  user?: User; // O usuário pode não ser sempre incluído, torne-o opcional
  address?: Address | null; // 'address' pode ser nulo vindo do Prisma
  _count?: { bookings: number }; // bookings count
};

export class ClientDetailsDto {
  @ApiProperty({ description: 'ID do cliente', example: 'uuid-do-cliente' })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Nome completo do cliente',
    example: 'João da Silva',
  })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({
    description: 'Telefone do cliente',
    example: '11999999999',
  })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional({
    type: () => CreateAddressDto,
    description: 'Informações de endereço do cliente',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto | null;

  @ApiPropertyOptional({
    description: 'Saldo da carteira do cliente',
    example: 150.75,
  })
  @IsOptional()
  @IsNumber()
  walletBalance?: number;

  @ApiPropertyOptional({
    description: 'Número de agendamentos concluídos',
    example: 10,
  })
  @IsOptional()
  @IsInt()
  ordersCount?: number;

  // Se 'createdAt' e 'updatedAt' foram adicionados ao modelo Client no schema.prisma:
  @ApiProperty({
    description: 'Data de criação do cliente',
    example: '2023-01-01T10:00:00.000Z',
  })
  @IsDateString()
  createdAt: Date; // Agora a propriedade existirá em `client`

  @ApiProperty({
    description: 'Data da última atualização do cliente',
    example: '2023-01-01T10:00:00.000Z',
  })
  @IsDateString()
  updatedAt: Date; // Agora a propriedade existirá em `client`

  @ApiPropertyOptional({
    description:
      'Ganhos totais no último mês (relevante para provedor, mas pode ser um campo geral de dashboard)',
    example: 500.0,
  })
  @IsOptional()
  @IsNumber()
  totalEarningsLastMonth?: number;

  @ApiPropertyOptional({
    description: 'Número de agendamentos futuros',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  upcomingBookingsCount?: number;

  constructor(client: ClientWithRelationsForDto) {
    this.id = client.id;
    this.fullName = client.fullName;
    this.phone = client.phone;
    if (client.address) {
      this.address = new CreateAddressDto();
      Object.assign(this.address, client.address);
    } else {
      this.address = null;
    }
    this.walletBalance = undefined;
    this.ordersCount = client._count?.bookings;
    // As propriedades 'createdAt' e 'updatedAt' são acessadas diretamente do objeto 'client'
    // porque agora (assumindo a correção no schema.prisma) elas existem lá.
    this.createdAt = client.createdAt;
    this.updatedAt = client.updatedAt;
    this.totalEarningsLastMonth = undefined;
    this.upcomingBookingsCount = undefined;
  }
}
