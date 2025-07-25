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
import { MessageResponseDto } from './dto/message-response.dto';
import { UserProfileDto } from '../users/dto/user-profile.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LocalAuthGuard } from '../auth/guards/local-auth.guard';

// NOVO: DTOs para autenticação baseada em telefone
import { RequestOtpDto, VerifyOtpDto } from './dto/otp-login.dto'; // Reutilizando DTOs existentes
import { CheckPhoneDto, LoginWithPhoneNumberAndPasswordDto } from './dto/phone-auth.dto'; // NOVOS DTOs

@ApiTags('auth')
@Controller('auth')
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
  @ApiOperation({ summary: 'Login de usuário/provedor (Email/Senha)' })
  @ApiResponse({ status: 200, description: 'Login bem-sucedido.', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async login(@Request() req): Promise<AuthResponseDto> {
    this.logger.log(`[AuthController] login: Recebida solicitação de login para usuário: ${req.user ? req.user.email : 'N/A'}`);
    return this.authService.login(req.user);
  }

  // Existing forgot-password - Mantido
  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar redefinição de senha' })
  @ApiResponse({ status: 200, description: 'Link de redefinição de senha enviado (se o email existir).', type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Email inválido.' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<MessageResponseDto> {
    this.logger.log(`[AuthController] forgotPassword: Recebida solicitação de redefinição de senha para email: ${forgotPasswordDto.email}`);
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return { message: 'Se um usuário com este email existir, um link de redefinição de senha será enviado.' };
  }

  // REMOVIDO: firebase-login
  // @Post('firebase-login')
  // @HttpCode(HttpStatus.OK)
  // async firebaseLogin(@Body() body: FirebaseLoginDto): Promise<AuthResponseDto> { ... }

  // NOVO: Verifica existência do número de telefone
  @Post('check-phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verifica se um número de telefone já está registrado.' })
  @ApiResponse({ status: 200, description: 'Retorna se o número de telefone existe e se tem senha.', type: Object }) // { exists: boolean, hasPassword?: boolean }
  async checkPhone(@Body() checkPhoneDto: CheckPhoneDto): Promise<{ exists: boolean; hasPassword?: boolean }> {
    this.logger.log(`[AuthController] checkPhone: Recebida solicitação para verificar telefone: ${checkPhoneDto.phoneNumber}`);
    return this.authService.checkPhoneNumberExistence(checkPhoneDto.phoneNumber);
  }

  // NOVO: Envia OTP
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envia um código OTP para o número de telefone fornecido.' })
  @ApiResponse({ status: 200, description: 'OTP enviado com sucesso.', type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Número de telefone inválido ou erro ao enviar OTP.' })
  async sendOtp(@Body() requestOtpDto: RequestOtpDto): Promise<MessageResponseDto> {
    this.logger.log(`[AuthController] sendOtp: Recebida solicitação para enviar OTP para: ${requestOtpDto.phone}`);
    await this.authService.sendOtp(requestOtpDto.phone);
    return { message: 'Código OTP enviado com sucesso.' };
  }

  // NOVO: Verifica OTP
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verifica o código OTP e realiza o login/registro.' })
  @ApiResponse({ status: 200, description: 'OTP verificado e login/registro bem-sucedido.', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Código OTP inválido ou expirado.' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<AuthResponseDto> {
    this.logger.log(`[AuthController] verifyOtp: Recebida solicitação para verificar OTP para: ${verifyOtpDto.phone}`);
    return this.authService.verifyOtp(verifyOtpDto.phone, verifyOtpDto.otpCode);
  }

  // NOVO: Login com número de telefone e senha
  @Post('login-phone-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de usuário via número de telefone e senha.' })
  @ApiResponse({ status: 200, description: 'Login bem-sucedido.', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Número de telefone ou senha inválidos.' })
  async loginPhonePassword(@Body() loginDto: LoginWithPhoneNumberAndPasswordDto): Promise<AuthResponseDto> {
    this.logger.log(`[AuthController] loginPhonePassword: Recebida solicitação de login para telefone: ${loginDto.phoneNumber}`);
    return this.authService.loginWithPhoneNumberAndPassword(loginDto.phoneNumber, loginDto.password);
  }
}