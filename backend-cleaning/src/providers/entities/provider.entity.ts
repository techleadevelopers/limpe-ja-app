import { Provider as PrismaProvider, User, Address, ProviderService, Review, VerificationStatus, Prisma } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProviderEntity implements PrismaProvider {
  @ApiProperty({ description: 'ID único do provedor', example: 'uuid-do-provedor' })
  id: string;

  @ApiProperty({ description: 'ID do usuário associado', example: 'uuid-do-usuario' })
  userId: string;

  @ApiProperty({ description: 'Nome completo do provedor', example: 'João da Silva' })
  fullName: string;

  @ApiPropertyOptional({ description: 'CPF do provedor', example: '123.456.789-00' })
  cpf: string | null; // Pode ser nulo

  @ApiPropertyOptional({ description: 'Data de nascimento do provedor', example: '1990-05-15T00:00:00.000Z' })
  dateOfBirth: Date | null; // Pode ser nulo

  @ApiPropertyOptional({ description: 'Número de telefone do provedor', example: '11987654321' })
  phone: string | null;

  @ApiPropertyOptional({ description: 'ID do endereço do provedor', example: 'uuid-do-endereco' })
  addressId: string | null;

  @ApiPropertyOptional({ description: 'Anos de experiência do provedor', example: 5 })
  yearsOfExperience: number | null;

  @ApiPropertyOptional({ description: 'URL do avatar do provedor', example: 'https://example.com/avatar.jpg' })
  avatarUrl: string | null;

  @ApiPropertyOptional({ description: 'Biografia do provedor', example: 'Profissional dedicada à limpeza há 5 anos.' })
  bio: string | null;

  @ApiProperty({ description: 'Status de verificação do provedor', enum: VerificationStatus, example: VerificationStatus.APPROVED })
  verificationStatus: VerificationStatus;

  @ApiPropertyOptional({ description: 'URL da foto frontal do documento', example: 'https://example.com/doc-front.jpg' })
  documentPhotoFrontUrl: string | null;

  @ApiPropertyOptional({ description: 'URL da foto traseira do documento', example: 'https://example.com/doc-back.jpg' })
  documentPhotoBackUrl: string | null;

  @ApiPropertyOptional({ description: 'URL da selfie com o documento', example: 'https://example.com/selfie-doc.jpg' })
  selfieWithDocumentUrl: string | null;

  @ApiPropertyOptional({ description: 'Resultado da verificação de antecedentes', example: { criminal: 'clear' } })
  backgroundCheckResult: Prisma.JsonValue | null;

  @ApiPropertyOptional({ description: 'Motivo da rejeição da verificação', example: 'Documento ilegível' })
  rejectionReason: string | null;

  @ApiPropertyOptional({ description: 'Chave PIX do provedor', example: '123.456.789-00' })
  pixKey: string | null;

  @ApiPropertyOptional({ description: 'Chave PIX mascarada para exibição', example: '123****-00' })
  pixKeyMasked: string | null;

  // ADICIONADO: ocrResult e livenessResult
  @ApiPropertyOptional({ description: 'Resultado do OCR no documento', example: { name: 'João da Silva' } })
  ocrResult: Prisma.JsonValue | null;

  @ApiPropertyOptional({ description: 'Resultado da verificação de vivacidade', example: { score: 0.95 } })
  livenessResult: Prisma.JsonValue | null;

  @ApiProperty({ description: 'Data de criação do provedor', example: '2023-01-01T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização do provedor', example: '2023-01-01T10:00:00.000Z' })
  updatedAt: Date;

  // NOVOS: fiveStarReviewCount e monthlyBookingsCount para bonificações
  @ApiProperty({ description: 'Contagem de avaliações 5 estrelas recebidas', example: 50 })
  fiveStarReviewCount: number;

  @ApiProperty({ description: 'Contagem de agendamentos concluídos no mês atual', example: 20 })
  monthlyBookingsCount: number;

  // CORREÇÃO: Adicionado badges
  @ApiProperty({ description: 'Lista de badges do provedor', example: ['VERIFIED', 'TOP_RATED'] })
  badges: string[];

  @ApiPropertyOptional({ description: 'Taxa de aceitação de agendamentos', example: 0.95 })
  acceptanceRate: number | null; // Adicionado para satisfazer PrismaProvider

  @ApiPropertyOptional({ description: 'Tempo médio de resposta em minutos', example: 15 })
  averageResponseTime: number | null; // Adicionado para satisfazer PrismaProvider

  user?: User; // Relações (opcionais, dependem de como você as carrega)
  address?: Address | null;
  providerServices?: ProviderService[];
  reviewsReceived?: Review[];

  constructor(partial: Partial<ProviderEntity>) {
    Object.assign(this, partial);
  }
}
