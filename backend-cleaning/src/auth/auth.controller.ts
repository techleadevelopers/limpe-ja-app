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
// import { RequestOtpDto, VerifyOtpDto } from './dto/otp-login.dto'; // REMOVIDO: DTOs para OTP customizado
import { LocalAuthGuard } from '../auth/guards/local-auth.guard';

// NOVO: DTO para o Firebase ID Token
class FirebaseLoginDto {
  idToken: string;
}

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
  @ApiOperation({ summary: 'Login de usuário/provedor (Email/Senha)' })
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

  // REMOVIDO: @Post('send-otp')
  // REMOVIDO: @Post('verify-otp')

  @Post('firebase-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login/Registro via Firebase ID Token (Telefone/Google/etc.)' })
  @ApiResponse({ status: 200, description: 'Login/Registro bem-sucedido via Firebase.', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'ID Token inválido ou expirado.' })
  @ApiResponse({ status: 400, description: 'Requisição inválida.' })
  async firebaseLogin(@Body() body: FirebaseLoginDto): Promise<AuthResponseDto> {
    this.logger.log(`[AuthController] firebaseLogin: Recebida solicitação de login com Firebase ID Token.`);
    return this.authService.verifyFirebaseIdToken(body.idToken);
  }
}