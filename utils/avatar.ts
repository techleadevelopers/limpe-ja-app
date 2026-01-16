export const cacheBustAvatarUrl = (url?: string | null, updatedAt?: string | null): string | undefined => {
  if (!url) {
    return undefined;
  }

  if (!updatedAt) {
    return url;
  }

  const parsed = Date.parse(updatedAt);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}ts=${parsed}`;
};
