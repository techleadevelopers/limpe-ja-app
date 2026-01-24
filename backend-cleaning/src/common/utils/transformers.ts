import type { TransformFnParams } from 'class-transformer';

export const trimText = ({ value }: TransformFnParams) =>
  typeof value === 'string' ? value.trim() : value;

const HTML_TAG_REGEX = /<[^>]+>/g;

export const sanitizeHtmlText = ({ value }: TransformFnParams) => {
  if (typeof value !== 'string') {
    return value;
  }
  const sanitized = value.replace(HTML_TAG_REGEX, '');
  return sanitized.trim();
};
