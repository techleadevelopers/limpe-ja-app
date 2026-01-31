import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import FormData from 'form-data';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const prisma = new PrismaClient();

const VISION_IA_URL =
  'https://blue-api-vision-ia-production.up.railway.app/vision/process-avatar';

// TXT NA RAIZ DO SCRIPT
const BACKUP_FILE = path.resolve(
  process.cwd(),
  `avatar-backup-${new Date().toISOString().split('T')[0]}.txt`
);

function backupLine(line: string) {
  fs.appendFileSync(BACKUP_FILE, line + '\n', { encoding: 'utf-8' });
}

async function run() {
  console.log('🚀 Iniciando processamento de avatares');
  console.log(`📝 Backup externo: ${BACKUP_FILE}`);

  const providers = await prisma.provider.findMany({
    where: {
      avatarUrl: { not: null },
      NOT: { avatarUrl: { contains: 'processed-' } },
    },
  });

  console.log(`📸 ${providers.length} avatares encontrados`);

  for (const p of providers) {
    try {
      console.log(`⏳ ${p.fullName}`);

      // 1️⃣ BACKUP EXTERNO (ANTES DE QUALQUER COISA)
      backupLine(
        `[${new Date().toISOString()}] | ${p.fullName} | providerId=${p.id} | ${p.avatarUrl!}`
      );

      // 2️⃣ BAIXA A IMAGEM ORIGINAL
      const imgResponse = await axios.get(p.avatarUrl!, {
        responseType: 'arraybuffer',
      });

      // 3️⃣ FORM DATA
      const formData = new FormData();
      formData.append('file', Buffer.from(imgResponse.data), {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

      // 4️⃣ ENVIA PARA O PROCESSOR
      const visionResponse = await axios.post(VISION_IA_URL, formData, {
        headers: { ...formData.getHeaders() },
      });

      const newAvatarUrl = visionResponse.data?.url;
      if (!newAvatarUrl) throw new Error('Processor não retornou URL');

      // 5️⃣ ATUALIZA O BANCO
      await prisma.provider.update({
        where: { id: p.id },
        data: { avatarUrl: newAvatarUrl },
      });

      console.log(`✅ Atualizado`);

    } catch (e: any) {
      const msg = e.response?.data?.message || e.message;
      console.error(`❌ ${p.fullName}: ${msg}`);
    }
  }

  console.log('✨ Finalizado com backup seguro');
  await prisma.$disconnect();
}

run();
