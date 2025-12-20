import { createHmac } from 'crypto';

export const PSP_SIGNATURE_PREFIX = 'sha256=';

export function normalizePspSignature(signature: string): string {
  if (!signature) {
    return '';
  }
  return signature.startsWith(PSP_SIGNATURE_PREFIX)
    ? signature.slice(PSP_SIGNATURE_PREFIX.length)
    : signature;
}

export function generatePspSignatureVariants(
  payload: string,
  secret: string,
): Set<string> {
  const digestHex = createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
    .toLowerCase();
  const digestBase64 = createHmac('sha256', secret)
    .update(payload)
    .digest('base64');
  return new Set([
    digestHex,
    `sha256=${digestHex}`,
    digestBase64,
    `sha256=${digestBase64}`,
  ]);
}

export function verifyPspSignature(
  signature: string | undefined,
  payload: string,
  secret: string,
): boolean {
  if (!signature || !secret) {
    return false;
  }
  const normalized = normalizePspSignature(signature).trim();
  const payloadString = payload ?? '';
  const variants = generatePspSignatureVariants(payloadString, secret);
  return variants.has(normalized);
}
