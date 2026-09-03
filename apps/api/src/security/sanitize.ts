const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const HTML_TAGS = /<[^>]*>/g;

export function sanitizeText(input: string, maxLength = 500): string {
  if (typeof input !== 'string') {
    return '';
  }
  return (
    input
      .replace(HTML_TAGS, '')
      .replace(CONTROL_CHARS, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLength)
  );
}

export function sanitizeOptionalText(input: string | undefined, maxLength = 500): string | undefined {
  if (input === undefined || input === null) {
    return undefined;
  }
  return sanitizeText(input, maxLength);
}
