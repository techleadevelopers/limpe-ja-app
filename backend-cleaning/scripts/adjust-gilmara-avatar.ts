import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import FormData from 'form-data';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Configurações do Alvo
const PROVIDER_ID = 'c3674795-ab95-4332-ba19-f04b577f9a8d';
const ORIGINAL_URL = 'https://utfs.io/f/wn3w6gEDynQ2aLAuT9bzEgnteLpDbkhlMOrXZBmRGc12xHwT';

// Nova rota de ajuste manual que criamos no Controller
const MANUAL_ADJUST_URL = 'https://blue-api-vision-ia-production.up.railway.app/vision/manual-adjust';

async function adjustAvatar() {
  console.log(`🎯 Iniciando ajuste vertical para Gilmara (ID: ${PROVIDER_ID})...`);

  try {
    // 1. Baixa a foto original da Gilmara
    console.log('⏳ Baixando imagem original...');
    const imgResponse = await axios.get(ORIGINAL_URL, { responseType: 'arraybuffer' });
    
    // 2. Monta o FormData com o arquivo e a porcentagem de corte
    const formData = new FormData();
    formData.append('file', Buffer.from(imgResponse.data), {
      filename: 'gilmara-original.png',
      contentType: 'image/png',
    });
    
    /**
     * ✅ A MÁGICA: Passamos 10% para cortar o excesso de corpo embaixo.
     * Isso vai forçar o rosto dela a subir no enquadramento 3x4.
     */
    formData.append('vertical_cut_pct', '10');

    console.log('🧠 Enviando para Vision IA para recorte vertical (Ajuste 10%)...');
    const visionResponse = await axios.post(MANUAL_ADJUST_URL, formData, {
      headers: { ...formData.getHeaders() }
    });

    const newAvatarUrl = visionResponse.data.url;

    if (newAvatarUrl) {
      // 3. Atualiza o banco de dados com a foto agora centralizada
      await prisma.provider.update({
        where: { id: PROVIDER_ID },
        data: { avatarUrl: newAvatarUrl }
      });
      console.log(`✅ Sucesso! Rosto elevado. Novo avatar: ${newAvatarUrl}`);
    }

  } catch (e: any) {
    const errorMsg = e.response?.data?.message || e.message;
    console.error(`❌ Erro no ajuste da Gilmara: ${errorMsg}`);
  } finally {
    await prisma.$disconnect();
  }
}

adjustAvatar();