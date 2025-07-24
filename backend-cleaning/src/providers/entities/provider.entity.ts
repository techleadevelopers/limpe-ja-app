import { Provider as PrismaProvider, User, Address, ProviderService, Review, VerificationStatus, Prisma } from '@prisma/client';

export class ProviderEntity implements PrismaProvider {
  id: string;
  userId: string;
  fullName: string;
  cpf: string | null; // Pode ser nulo
  dateOfBirth: Date | null; // Pode ser nulo
  phone: string | null;
  addressId: string | null;
  yearsOfExperience: number | null;
  avatarUrl: string | null;

  bio: string | null;

  verificationStatus: VerificationStatus;
  documentPhotoFrontUrl: string | null;
  documentPhotoBackUrl: string | null;
  selfieWithDocumentUrl: string | null;
  backgroundCheckResult: Prisma.JsonValue | null;
  rejectionReason: string | null;
  pixKey: string | null;

  // ADICIONADO: ocrResult e livenessResult
  ocrResult: Prisma.JsonValue | null;
  livenessResult: Prisma.JsonValue | null;

  createdAt: Date;
  updatedAt: Date;

  user?: User; // Relações (opcionais, dependem de como você as carrega)
  address?: Address | null;
  providerServices?: ProviderService[];
  reviewsReceived?: Review[];

  constructor(partial: Partial<ProviderEntity>) {
    Object.assign(this, partial);
  }
}