import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  ArrayNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
} from 'class-validator';
import { BookingProofType, Prisma } from '@prisma/client';

const toRecord = (
  value?: Prisma.JsonValue | null,
): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

export class SubmitBookingProofDto {
  @ApiProperty({
    description: 'URLs das fotos que comprovam o check-in ou check-out',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  photos: string[];

  @ApiPropertyOptional({
    description: 'URL do vídeo complementar (obrigatório para checkout em planos premium)',
  })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'Hashes de arquivos enviados para validação/registro',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  hashes?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Marcas de tempo registradas pelo dispositivo',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  timestamps?: Record<string, unknown>;
}

export class BookingProofResponseDto {
  @ApiProperty({ description: 'Identificador do comprovante', example: 'proof-123' })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Tipo do comprovante (CHECKIN ou CHECKOUT)',
    enum: BookingProofType,
  })
  @IsEnum(BookingProofType)
  type: BookingProofType;

  @ApiProperty({ description: 'URLs das fotos registradas', type: [String] })
  @IsArray()
  @IsString({ each: true })
  photos: string[];

  @ApiPropertyOptional({ description: 'URL do vídeo enviado', example: 'https://...' })
  @IsOptional()
  @IsString()
  videoUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Hashes enviados junto com o comprovante',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  hashes?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'Timestamps armazenados',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  timestamps?: Record<string, unknown> | null;

  @ApiProperty({ description: 'ID do usuário que enviou o comprovante', example: 'user-1' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Data de criação do registro', example: '2025-01-01T09:00:00.000Z' })
  @IsString()
  createdAt: string;

  constructor(data: {
    id: string;
    type: BookingProofType;
    photos: Prisma.JsonValue;
    videoUrl?: string | null;
    hashes?: Prisma.JsonValue | null;
    timestamps?: Prisma.JsonValue | null;
    userId: string;
    createdAt: Date | string;
  }) {
    this.id = data.id;
    this.type = data.type;
    this.photos = Array.isArray(data.photos)
      ? data.photos.filter((photo): photo is string => typeof photo === 'string')
      : [];
    this.videoUrl = data.videoUrl ?? null;
    this.hashes = toRecord(data.hashes ?? null);
    this.timestamps = toRecord(data.timestamps ?? null);
    this.userId = data.userId;
    this.createdAt =
      data.createdAt instanceof Date
        ? data.createdAt.toISOString()
        : data.createdAt;
  }
}
