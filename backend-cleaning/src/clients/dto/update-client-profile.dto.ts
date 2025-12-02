import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsPhoneNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAddressDto } from '../../common/dto/create-address.dto'; // Importe o DTO de endereço

export class UpdateClientProfileDto {
  @ApiPropertyOptional({
    description: 'Nome completo do cliente',
    example: 'Maria da Silva Atualizada',
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Número de telefone do cliente (formato internacional)',
    example: '+5511987654321',
  })
  @IsOptional()
  @IsString()
  @IsPhoneNumber('BR') // Descomente se quiser validar o formato de telefone para o Brasil
  phone?: string;

  @ApiPropertyOptional({
    type: () => CreateAddressDto,
    description: 'Informações de endereço do cliente',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto; // Adicionado para permitir atualização do endereço
}
