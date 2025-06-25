// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { WsAuthGuard } from './guards/ws-auth.guard'; // Importe o WsAuthGuard

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    // Configuração do JWT
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION_TIME') },
      }),
    }),
    UsersModule, // Necessário para AuthService criar e validar usuários
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    WsAuthGuard, // <--- Adicione WsAuthGuard como um provider
  ],
  exports: [
    AuthService,
    JwtModule, // <--- Exporte JwtModule para que JwtService esteja disponível
    WsAuthGuard, // <--- Exporte WsAuthGuard para que outros módulos possam usá-lo
  ],
})
export class AuthModule {}