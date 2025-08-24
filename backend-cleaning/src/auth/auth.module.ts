// src/auth/auth.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { ProvidersModule } from '../providers/providers.module';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { EmailModule } from '../common/modules/email.module';
import { GeocodingModule } from '../common/modules/geocoding.module';
import { ReferralsModule } from '../referrals/referrals.module'; // NOVO: Importar ReferralsModule

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION_TIME') },
      }),
    }),
    forwardRef(() => UsersModule),
    forwardRef(() => ProvidersModule),
    EmailModule,
    GeocodingModule,
    forwardRef(() => ReferralsModule), // NOVO: Adicionar forwardRef para ReferralsModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    WsAuthGuard,
  ],
  exports: [
    AuthService,
    JwtModule,
    WsAuthGuard,
  ],
})
export class AuthModule {}