const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  await prisma.();
  const res = await prisma.SELECT id, status, applied_steps_count, rolled_back, failed_at, logs FROM  _prisma_migrations ORDER BY started_at DESC LIMIT 10;
  console.log(res);
  await prisma.();
})();
