// src/users/users.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersController } from './users.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { QueuesModule } from '../queues/queues.module';
import { AuthModule } from '../auth/auth.module';
import { ProvidersModule } from '../providers/providers.module'; // Importando ProvidersModule

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    QueuesModule,
    forwardRef(() => AuthModule), // Correto
    forwardRef(() => ProvidersModule), // CORREÇÃO: Adicionado forwardRef para resolver a dependência circular.
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
