// src/chat/chat-moderation.ts
const MODERATION_PATTERNS: Array<{ regex: RegExp; reason: string }> = [
  {
    regex: /(https?:\/\/|www\.)\S+/i,
    reason: 'URL detectada na mensagem.',
  },
  {
    regex: /\b[\w.+-]+@[\w.-]+\.\w{2,}\b/i,
    reason: 'Email detectado na mensagem.',
  },
  {
    regex: /\b(?:whatsapp|zap|zapzap)\b/i,
    reason: 'Referência a WhatsApp detectada.',
  },
  {
    regex: /\bpix\b/i,
    reason: 'Referência a Pix detectada.',
  },
  {
    regex:
      /(?:\+?\d{1,3}[\s.():,;*-]*)?(?:\(?\d{2,3}\)?[\s.():,;*-]*)?(?:\d[\s.():,;*-]*){6,}/,
    reason: 'Número de contato detectado na mensagem.',
  },
  {
    regex: /(?:\d[\s.():,;*-]*){6,}/,
    reason: 'Sequência extensa de dígitos ou tentativa de ofuscação detectada.',
  },
];

export function detectPolicyViolation(
  content: string | undefined,
): string | undefined {
  if (!content) {
    return undefined;
  }

  for (const pattern of MODERATION_PATTERNS) {
    if (pattern.regex.test(content)) {
      return pattern.reason;
    }
  }

  return undefined;
}
