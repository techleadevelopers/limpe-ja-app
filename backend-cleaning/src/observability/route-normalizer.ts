const DYNAMIC_SEGMENT_PATTERNS = [
  /^[0-9]{3,}$/, // números inteiros longos
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, // UUID
  /^[0-9a-f]{24}$/i, // Mongo ObjectId
  /^[0-9a-f]{32}$/i, // hashes hex longos
  /^[A-Za-z0-9_-]{20,}$/i, // hashes/tokens mistos
];

const normalizeSegment = (segment: string): string => {
  if (!segment) return '';
  if (segment.startsWith(':')) return '{id}';
  const cleaned = segment.trim();
  const lower = cleaned.toLowerCase();
  const isDynamic =
    DYNAMIC_SEGMENT_PATTERNS.some((pattern) => pattern.test(cleaned)) ||
    DYNAMIC_SEGMENT_PATTERNS.some((pattern) => pattern.test(lower));
  return isDynamic ? '{id}' : lower;
};

const stripQueryAndHash = (path: string): string => {
  return path.split('?')[0].split('#')[0];
};

export const normalizeRouteKey = (urlOrRoutePath?: string): string => {
  if (!urlOrRoutePath) return '/';
  const cleaned = stripQueryAndHash(urlOrRoutePath);
  const segments = cleaned
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map(normalizeSegment);

  if (segments.length === 0) {
    return '/';
  }

  return `/${segments.join('/')}`;
};
