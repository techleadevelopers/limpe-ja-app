import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Mantenha ConfigModule aqui e use-o no JwtModule.registerAsync
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { ProvidersModule } from '../providers/providers.module';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { EmailModule } from '../common/modules/email.module'; // <--- Adicione esta importação
import { GeocodingModule } from '../common/modules/geocoding.module'; // <--- Adicione esta importação

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule], // <--- Adicione esta linha para importar ConfigModule
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION_TIME') },
      }),
    }),
    UsersModule,
    ProvidersModule,
    EmailModule, // <--- Adicione esta linha para importar EmailModule
    GeocodingModule, // <--- Adicione esta linha para importar GeocodingModule
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
