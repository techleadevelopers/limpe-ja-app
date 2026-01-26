import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import FormData from 'form-data';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
// Rota exata do seu ProcessorController
const VISION_IA_URL = 'https://blue-api-vision-ia-production.up.railway.app/vision/process-avatar';

async function run() {
  console.log('🚀 Iniciando Rebranding Oficial via Blue Vision IA...');

  const providers = await prisma.provider.findMany({
    where: { 
      avatarUrl: { not: null },
      // Filtro baseado no prefixo que seu controller usa no upload
      NOT: { avatarUrl: { contains: 'processed-' } } 
    }
  });

  console.log(`📸 Total de ${providers.length} avatares para processar.`);

  for (const p of providers) {
    try {
      console.log(`⏳ Processando: ${p.fullName}...`);

      // 1. Baixa a foto original
      const imgResponse = await axios.get(p.avatarUrl!, { responseType: 'arraybuffer' });
      
      // 2. Monta o FormData com o campo 'file'
      const formData = new FormData();
      formData.append('file', Buffer.from(imgResponse.data), {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

      // 3. POST para a rota real
      const visionResponse = await axios.post(VISION_IA_URL, formData, {
        headers: { ...formData.getHeaders() }
      });

      // O seu controller retorna { url: result.url }
      const newAvatarUrl = visionResponse.data.url;

      if (newAvatarUrl) {
        await prisma.provider.update({
          where: { id: p.id },
          data: { avatarUrl: newAvatarUrl }
        });
        console.log(`✅ Sucesso! Novo avatar: ${newAvatarUrl}`);
      }

    } catch (e: any) {
      const errorMsg = e.response?.data?.message || e.message;
      console.error(`❌ Erro em ${p.fullName}: ${errorMsg}`);
    }
  }

  console.log('✨ Processo finalizado com sucesso!');
  await prisma.$disconnect();
}

run();