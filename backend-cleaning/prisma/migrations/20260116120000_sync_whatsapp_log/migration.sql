/*
  Sincronização manual da tabela WhatsappWebhookLog 
  para bater com a cagada do Codex no schema.prisma
*/

-- 1. Remove as colunas que não existem mais no schema.prisma
ALTER TABLE "WhatsappWebhookLog" 
DROP COLUMN IF EXISTS "phone",
DROP COLUMN IF EXISTS "text",
DROP COLUMN IF EXISTS "status",
DROP COLUMN IF EXISTS "messageId";

-- 2. Garante que as colunas event, instanceId e data existam
-- (Caso não existam, ele adiciona. Se já existirem, não faz nada)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='WhatsappWebhookLog' AND column_name='event') THEN
        ALTER TABLE "WhatsappWebhookLog" ADD COLUMN "event" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='WhatsappWebhookLog' AND column_name='instanceId') THEN
        ALTER TABLE "WhatsappWebhookLog" ADD COLUMN "instanceId" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='WhatsappWebhookLog' AND column_name='data') THEN
        ALTER TABLE "WhatsappWebhookLog" ADD COLUMN "data" JSONB NOT NULL DEFAULT '{}';
    END IF;
END $$;