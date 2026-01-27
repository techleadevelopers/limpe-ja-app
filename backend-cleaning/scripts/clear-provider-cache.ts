import { createClient } from 'redis';
import * as dotenv from 'dotenv';

dotenv.config();

async function forceClear() {
  // Usando a URL que você confirmou no log
  const redisUrl = "redis://default:NrEOPVIlsWyGGvUDmUuxzlKtpUuUjyqz@metro.proxy.rlwy.net:56816";
  const userId = "f0e969f6-85a3-4868-bb1b-d1ec237d49dd";

  const client = createClient({ url: redisUrl });
  client.on('error', (err: any) => console.log('Redis Client Error', err));

  try {
    await client.connect();
    console.log("🔌 Conectado ao Redis da Railway...");

    // 🔍 Busca chaves que contenham o ID (ignora prefixos)
    const keys = await client.keys(`*${userId}*`);

    if (keys.length > 0) {
      console.log(`🔎 Encontradas ${keys.length} chaves para deletar:`);
      for (const key of keys) {
        await client.del(key);
        console.log(`🗑️ Deletada: ${key}`);
      }
      console.log("✅ Cache limpo com sucesso!");
    } else {
      console.log("⚠️ Nenhuma chave encontrada com esse ID. Tentando buscar chaves de 'all_approved'...");
      // Busca alternativa caso o cache use uma chave de lista
      const allKeys = await client.keys('*all_approved*');
      if (allKeys.length > 0) {
        for (const k of allKeys) {
          await client.del(k);
          console.log(`🗑️ Deletada chave de lista: ${k}`);
        }
      }
    }

  } catch (error) {
    console.error("❌ Erro ao limpar Redis:", error);
  } finally {
    await client.quit();
  }
}

forceClear();