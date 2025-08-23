// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  UnauthorizedException,
  Logger,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto'; // Para login por email/senha
import { RegisterClientDto } from './dto/register-client.dto';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { UserProfileDto } from '../users/dto/user-profile.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LocalAuthGuard } from '../auth/guards/local-auth.guard';
// import { ThrottlerGuard } from '@nestjs/throttler'; // Importe se estiver usando Throttler

@ApiTags('auth')
@Controller('auth')
// @UseGuards(ThrottlerGuard) // Aplicar rate limiting a todas as rotas do controlador
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  // Existing register/client - Mantido
  @Post('register/client')
  @ApiOperation({ summary: 'Registrar um novo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente registrado com sucesso.', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Dados de registro inválidos.' })
  async registerClient(@Body() registerClientDto: RegisterClientDto): Promise<AuthResponseDto> {
    this.logger.log(`[AuthController] registerClient: Recebida solicitação de registro para cliente: ${registerClientDto.email}`);
    return this.authService.registerClient(registerClientDto);
  }

  // Existing register/provider - Mantido
  @Post('register/provider')
  @ApiOperation({ summary: 'Registrar um novo provedor' })
  @ApiResponse({ status: 201, description: 'Provedor registrado com sucesso.', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Dados de registro inválidos.' })
  async registerProvider(@Body() registerProviderDto: RegisterProviderDto): Promise<AuthResponseDto> {
    this.logger.log(`[AuthController] registerProvider: Recebida solicitação de registro para provedor: ${registerProviderDto.email}`);
    return this.authService.registerProvider(registerProviderDto);
  }

  // Existing login (email/password) - Mantido
  @UseGuards(LocalAuthGuard)
  @Post('login')
  // @UseGuards(ThrottlerGuard) // Pode aplicar rate limiting apenas a esta rota
  @ApiOperation({ summary: 'Login de usuário/provedor (Email/Senha)' })
  @ApiResponse({ status: 200, description: 'Login bem-sucedido.', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async login(@Request() req): Promise<AuthResponseDto> {
    this.logger.log(`[AuthController] login: Recebida solicitação de login para usuário: ${req.user ? req.user.email : 'N/A'}`);
    return this.authService.login(req.user);
  }

  // Existing forgot-password - Mantido
  @Post('forgot-password')
  // @UseGuards(ThrottlerGuard) // Pode aplicar rate limiting apenas a esta rota
  @ApiOperation({ summary: 'Solicitar redefinição de senha' })
  @ApiResponse({ status: 200, description: 'Link de redefinição de senha enviado (se o email existir).', type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Email inválido.' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<MessageResponseDto> {
    this.logger.log(`[AuthController] forgotPassword: Recebida solicitação de redefinição de senha para email: ${forgotPasswordDto.email}`);
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return { message: 'Se um usuário com este email existir, um link de redefinição de senha será enviado.' };
  }
}