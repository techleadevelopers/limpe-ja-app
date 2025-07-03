// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Request, Get, UnauthorizedException, Logger } from '@nestjs/common'; // Adicionado UnauthorizedException, Logger
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterClientDto } from './dto/register-client.dto';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthResponseDto } from './dto/auth-response.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { UserProfileDto } from '../users/dto/user-profile.dto';
import { PrismaService } from '../prisma/prisma.service'; // Importe PrismaService
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';


@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name); // Instancie o Logger

  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService, // Injeta PrismaService para buscar o perfil completo
  ) {}

  @Post('register/client')
  @ApiOperation({ summary: 'Registrar um novo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente registrado com sucesso.', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Dados de registro inválidos.' })
  async registerClient(@Body() registerClientDto: RegisterClientDto): Promise<AuthResponseDto> {
    this.logger.log(`[AuthController] registerClient: Recebida solicitação de registro para cliente: ${registerClientDto.email}`);
    return this.authService.registerClient(registerClientDto);
  }

  @Post('register/provider')
  @ApiOperation({ summary: 'Registrar um novo provedor' })
  @ApiResponse({ status: 201, description: 'Provedor registrado com sucesso.', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Dados de registro inválidos.' })
  async registerProvider(@Body() registerProviderDto: RegisterProviderDto): Promise<AuthResponseDto> {
    this.logger.log(`[AuthController] registerProvider: Recebida solicitação de registro para provedor: ${registerProviderDto.email}`);
    return this.authService.registerProvider(registerProviderDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login de usuário/provedor' })
  @ApiResponse({ status: 200, description: 'Login bem-sucedido.', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async login(@Request() req): Promise<AuthResponseDto> {
    this.logger.log(`[AuthController] login: Recebida solicitação de login para usuário: ${req.user ? req.user.email : 'N/A'}`);
    // O Passport.js já validou o usuário e o anexou ao objeto req.user
    // req.user aqui é do tipo Prisma.User (retornado por validateUser)
    return this.authService.login(req.user);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar redefinição de senha' })
  @ApiResponse({ status: 200, description: 'Link de redefinição de senha enviado (se o email existir).', type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Email inválido.' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<MessageResponseDto> {
    this.logger.log(`[AuthController] forgotPassword: Recebida solicitação de redefinição de senha para email: ${forgotPasswordDto.email}`);
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return { message: 'Se um usuário com este email existir, um link de redefinição de senha será enviado.' };
  }

  // O endpoint GET 'profile' foi removido daqui, pois o endpoint canônico
  // para obter o perfil do usuário logado é GET 'users/me' no UsersController.
}