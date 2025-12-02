// src/common/dto/address-details.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer'; // Importe Transform

export class AddressDetailsDto {
  // Renomeado de CreateAddressDto
  @ApiPropertyOptional({
    description: 'ID do endereço (opcional, se já existir)',
    example: 'uuid-do-endereco',
  })
  @IsOptional()
  @IsString()
  id?: string; // Adicionado id como opcional

  @ApiProperty({ description: 'CEP do endereço', example: '01001000' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? String(value).replace(/\D/g, '') : value)) // <-- ADICIONE ESTA LINHA
  cep: string;

  @ApiProperty({ description: 'Rua do endereço', example: 'Rua Principal' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ description: 'Número do endereço', example: '123' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiPropertyOptional({
    description: 'Complemento do endereço',
    example: 'Apt 101',
  })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiProperty({ description: 'Bairro do endereço', example: 'Centro' })
  @IsString()
  @IsNotEmpty()
  neighborhood: string;

  @ApiProperty({ description: 'Cidade do endereço', example: 'São Paulo' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'Estado do endereço (UF)', example: 'SP' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ description: 'Latitude do endereço', example: -23.5505 })
  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @ApiProperty({ description: 'Longitude do endereço', example: -46.6333 })
  @IsNumber()
  @Type(() => Number)
  longitude: number;

  constructor(partial: Partial<AddressDetailsDto>) {
    // Construtor para aceitar objeto parcial
    Object.assign(this, partial);
  }
}
