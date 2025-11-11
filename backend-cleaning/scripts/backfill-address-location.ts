// backend-cleaning/scripts/backfill-address-location.ts
// Preenche Address.location (geometry) a partir de latitude/longitude quando ausente

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[Backfill] Iniciando backfill de Address.location a partir de latitude/longitude...');
  try {
    // Atualiza todas as linhas com lat/lon válidos e location nula
    const updated: number = await prisma.$executeRawUnsafe(`
      UPDATE "Address"
      SET location = ST_SetSRID(ST_MakePoint(CAST("longitude" AS double precision), CAST("latitude" AS double precision)), 4326)
      WHERE location IS NULL AND "latitude" IS NOT NULL AND "longitude" IS NOT NULL
    `);
    console.log(`[Backfill] Concluído. Linhas atualizadas: ${updated}`);
  } catch (err: any) {
    console.error('[Backfill] ERRO ao preencher Address.location:', err?.message || err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();

