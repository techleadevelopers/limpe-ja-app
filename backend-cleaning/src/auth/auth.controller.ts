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
  HttpCode, // Adicionado HttpCode para definir o status HTTP de sucesso
  HttpStatus // Adicionado HttpStatus para usar os códigos de status
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterClientDto } from './dto/register-client.dto';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { UserProfileDto } from '../users/dto/user-profile.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RequestOtpDto, VerifyOtpDto } from './dto/otp-login.dto'; // Já está importado, ótimo!
import { LocalAuthGuard } from '../auth/guards/local-auth.guard';


@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
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

  @Post('send-otp') // A rota do front-end estava chamando 'send-otp', então o back-end deve ter 'send-otp'
  @HttpCode(HttpStatus.OK) // Retorna 200 OK em caso de sucesso
  @ApiOperation({ summary: 'Solicitar código OTP para login por telefone' })
  @ApiResponse({ status: 200, description: 'Código OTP enviado com sucesso.', type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Dados de requisição inválidos.' })
  async requestOtp(@Body() requestOtpDto: RequestOtpDto): Promise<MessageResponseDto> {
    this.logger.log(`[AuthController] requestOtp: Recebida solicitação de OTP para telefone: ${requestOtpDto.phone}`);
    await this.authService.requestOtp(requestOtpDto.phone);
    return { message: 'Código OTP enviado para o número informado.' };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK) // Retorna 200 OK em caso de sucesso
  @ApiOperation({ summary: 'Verificar código OTP e fazer login/registrar' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso.', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Código OTP inválido ou expirado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<AuthResponseDto> {
    this.logger.log(`[AuthController] verifyOtp: Recebida solicitação de verificação de OTP para telefone: ${verifyOtpDto.phone}`);
    return this.authService.verifyOtp(verifyOtpDto.phone, verifyOtpDto.otpCode);
  }
}