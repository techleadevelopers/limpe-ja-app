// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterClientDto } from './dto/register-client.dto';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LocalAuthGuard } from '../auth/guards/local-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '@prisma/client';
import { Request as ExpressRequest } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthErrorCode } from '../common/constants/auth-error-code';

type AuthenticatedRequest = ExpressRequest & { user?: User };
const maskEmail = (email?: string) => {
  if (!email) {
    return 'unknown';
  }
  const [local, domain] = email.split('@');
  if (!domain) {
    return '***@hidden';
  }
  const maskedLocal =
    local.length <= 2 ? `${local[0]}*` : `${local[0]}${'*'.repeat(local.length - 2)}${local.slice(-1)}`;
  return `${maskedLocal}@${domain}`;
};
// import { ThrottlerGuard } from '@nestjs/throttler'; // Importe se estiver usando Throttler

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Existing register/client - Mantido
  @Post('register/client')
  @ApiOperation({ summary: 'Registrar um novo cliente' })
  @ApiResponse({
    status: 201,
    description: 'Cliente registrado com sucesso.',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados de registro inválidos.' })
  async registerClient(
    @Body() registerClientDto: RegisterClientDto,
  ): Promise<AuthResponseDto> {
    this.logger.log(
      `[AuthController] registerClient: Recebida solicitação de registro para cliente: ${registerClientDto.email}`,
    );
    return this.authService.registerClient(registerClientDto);
  }

  // Existing register/provider - Mantido
  @Post('register/provider')
  @ApiOperation({ summary: 'Registrar um novo provedor' })
  @ApiResponse({
    status: 201,
    description: 'Provedor registrado com sucesso.',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados de registro inválidos.' })
  async registerProvider(
    @Body() registerProviderDto: RegisterProviderDto,
  ): Promise<AuthResponseDto> {
    this.logger.log(
      `[AuthController] registerProvider: Recebida solicitação de registro para provedor: ${registerProviderDto.email}`,
    );
    return this.authService.registerProvider(registerProviderDto);
  }

  // Existing login (email/password) - Mantido
  @UseGuards(ThrottlerGuard, LocalAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @Post('login')
  @ApiOperation({ summary: 'Login de usuário/provedor (Email/Senha)' })
  @ApiResponse({
    status: 200,
    description: 'Login bem-sucedido.',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async login(@Request() req: AuthenticatedRequest): Promise<AuthResponseDto> {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado na requisição.');
    }
    this.logger.log(
    `[AuthController] login: tentativa recebida para userId=${user.id}`,
    );
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-device')
  @ApiOperation({ summary: 'Deslogar o dispositivo atual e remover o push token' })
  @ApiResponse({
    status: 200,
    description: 'Push token removido do dispositivo.',
    type: MessageResponseDto,
  })
  async logoutDevice(
    @Request() req: AuthenticatedRequest,
  ): Promise<MessageResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException({
        message: 'Usuário não autenticado.',
        code: AuthErrorCode.UNAUTHORIZED,
      });
    }

    await this.notificationsService.unregisterDeviceToken(userId);
    return { message: 'Token do dispositivo removido com sucesso.' };
  }

  // Existing forgot-password - Mantido
  @Post('forgot-password')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60 } })
  // @UseGuards(ThrottlerGuard) // Pode aplicar rate limiting apenas a esta rota
  @ApiOperation({ summary: 'Solicitar redefinição de senha' })
  @ApiResponse({
    status: 200,
    description: 'Link de redefinição de senha enviado (se o email existir).',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Email inválido.' })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<MessageResponseDto> {
    this.logger.log(
      `[AuthController] forgotPassword request for email=${maskEmail(
        forgotPasswordDto.email,
      )}`,
    );
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return {
      message:
        'Se um usuário com este email existir, um link de redefinição de senha será enviado.',
    };
  }
}
