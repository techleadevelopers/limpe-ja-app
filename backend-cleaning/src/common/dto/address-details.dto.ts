// src/common/dto/address-details.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class AddressDetailsDto {
  @ApiProperty({ description: 'ID do endereço', example: 'uuid-do-endereco' })
  @IsString()
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'CEP do endereço', example: '01001000' })
  @IsString()
  @IsNotEmpty()
  cep: string;

  @ApiProperty({ description: 'Rua do endereço', example: 'Rua Principal' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ description: 'Número do endereço', example: '123' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiPropertyOptional({ description: 'Complemento do endereço', example: 'Apt 101' })
  @IsOptional()
  @IsString()
  complement: string | null;

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

  constructor(partial: Partial<AddressDetailsDto>) {
    Object.assign(this, partial);
    this.complement = partial.complement === undefined ? null : partial.complement;
  }
}