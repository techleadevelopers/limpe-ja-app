export enum ConsentDocumentType {
  TERMS = 'TERMS',
  PRIVACY = 'PRIVACY',
  COOKIES = 'COOKIES',
}

export const DEFAULT_CONSENT_VERSIONS: Record<ConsentDocumentType, string> = {
  [ConsentDocumentType.TERMS]:
    process.env.TERMS_VERSION ?? '1.0',
  [ConsentDocumentType.PRIVACY]:
    process.env.PRIVACY_VERSION ?? 'privacy-v1',
  [ConsentDocumentType.COOKIES]:
    process.env.COOKIES_VERSION ?? 'cookies-v1',
};
