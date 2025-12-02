import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator'; // Importe conforme necessário para DTOs, não estritamente para entidades

export class AddressEntity {
  @ApiProperty({
    description: 'ID único do endereço',
    example: 'uuid-do-endereco',
  })
  id: string;

  @ApiProperty({ description: 'CEP', example: '12345-678' })
  cep: string;

  @ApiProperty({ description: 'Rua', example: 'Rua das Flores' })
  street: string;

  @ApiProperty({ description: 'Número', example: '123' })
  number: string;

  @ApiPropertyOptional({ description: 'Complemento', example: 'Apto 101' })
  complement: string | null;

  @ApiProperty({ description: 'Bairro', example: 'Centro' })
  neighborhood: string;

  @ApiProperty({ description: 'Cidade', example: 'São Paulo' })
  city: string;

  @ApiProperty({ description: 'Estado (UF)', example: 'SP' })
  state: string;

  @ApiPropertyOptional({
    description: 'Latitude do endereço',
    example: -23.5505,
  })
  latitude: number | null;

  @ApiPropertyOptional({
    description: 'Longitude do endereço',
    example: -46.6333,
  })
  longitude: number | null;

  // As chaves estrangeiras clientId e providerId são internas do Prisma e geralmente não são expostas diretamente
  // em DTOs de retorno, mas podem estar na entidade para completude do modelo.
  clientId: string | null;
  providerId: string | null;

  // As relações 'client' e 'provider' não são incluídas aqui para evitar dependências circulares
  // e manter a entidade de endereço focada em seus próprios atributos.

  constructor(partial: Partial<AddressEntity>) {
    Object.assign(this, partial);
  }
}
