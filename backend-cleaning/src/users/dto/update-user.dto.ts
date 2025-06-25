import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Novo endereço de e-mail do usuário', example: 'novo.email@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  // Adicione outros campos que podem ser atualizados no perfil geral do usuário
  // Por exemplo, se o `fullName` estiver no modelo User diretamente ou se você quiser atualizar campos comuns
  // que não são específicos de Cliente/Provedor.
  // Pelo seu schema.prisma, fullName está em Client e Provider, não em User.
  // Se quiser atualizar o fullName via rota de usuário, você precisaria de um serviço de usuário
  // que também atualize o Client ou Provider associado.
  // Por ora, deixarei apenas email como exemplo de campo comum.

  // @ApiPropertyOptional({ description: 'Nome completo do usuário', example: 'João da Silva Atualizado' })
  // @IsOptional()
  // @IsString()
  // fullName?: string;
}