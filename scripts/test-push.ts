#!/usr/bin/env ts-node
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../backend-cleaning/src/app.module';
import { NotificationService } from '../backend-cleaning/src/services/NotificationService';

const TARGET_USER_ID = process.argv[2] || process.env.TARGET_USER_ID;

async function main() {
  if (!TARGET_USER_ID) {
    throw new Error(
      'Informe o userId alvo como argumento ou via TARGET_USER_ID.',
    );
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const notificationService = app.get(NotificationService, { strict: true });

  try {
    await notificationService.sendToUser(
      TARGET_USER_ID,
      'Conquista desbloqueada! 🎉',
      'Missão concluída com sucesso. Toque para conferir os premiuns.',
      {
        type: 'MISSION_COMPLETED',
        missionId: 'test-123',
      },
    );
    console.log('Payload de teste enviado com sucesso.');
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error('teste de push falhou:', error);
  process.exit(1);
});
