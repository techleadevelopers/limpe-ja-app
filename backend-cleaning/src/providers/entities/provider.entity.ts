import { Provider as PrismaProvider, User, Address, ProviderService, Review, VerificationStatus, Prisma } from '@prisma/client';

// Esta entidade pode ser usada para tipagem interna ou para mapear o retorno do Prisma
// Se você estiver usando o Prisma Client diretamente, muitas vezes pode usar os tipos gerados por ele.
// No entanto, para consistência ou para adicionar métodos, uma classe de entidade pode ser útil.
export class ProviderEntity implements PrismaProvider {
  id: string;
  userId: string;
  fullName: string;
  cpf: string;
  dateOfBirth: Date;
  phone: string | null;
  addressId: string | null; // Este campo é gerado automaticamente pelo Prisma para a relação Address
  yearsOfExperience: number | null;
  avatarUrl: string | null;
  // REMOVIDO: verified: boolean; // Substituído por verificationStatus

  bio: string | null; // <-- ADICIONADO: Mantido conforme sua solicitação

  // NOVOS CAMPOS DE VERIFICAÇÃO
  verificationStatus: VerificationStatus;
  documentPhotoFrontUrl: string | null;
  documentPhotoBackUrl: string | null;
  selfieWithDocumentUrl: string | null;
  backgroundCheckResult: Prisma.JsonValue | null; // Usar Prisma.JsonValue para o tipo Json
  rejectionReason: string | null;
  pixKey: string | null; // <--- ADICIONADO: Esta linha resolve o erro TS2420

  // Relações (opcional, dependendo de como você quer tipar)
  user?: User;
  address?: Address | null;
  providerServices?: ProviderService[];
  reviewsReceived?: Review[]; // Adicionado reviewsReceived para completar as relações

  constructor(partial: Partial<ProviderEntity>) {
    Object.assign(this, partial);
  }
}