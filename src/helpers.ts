const MAX_SAFE_INTEGER_BIG = BigInt(Number.MAX_SAFE_INTEGER);

export function parseQuotedArgs(message: string): string[] {
  const trimmed = message.trim();
  const firstSpace = trimmed.indexOf(" ");
  if (firstSpace === -1) return [];

  const argsText = trimmed.substring(firstSpace).trim();
  const args: string[] = [];
  const regex = /"([^"]*)"|'([^']*)'|([^\s"']+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(argsText)) !== null) {
    const val = match[1] ?? match[2] ?? match[3];
    if (val !== undefined) args.push(val);
  }

  return args;
}

export function clampToSafeInteger(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Angka input tidak valid.");
  }

  const floored = Math.floor(value);
  if (BigInt(Math.abs(floored)) > MAX_SAFE_INTEGER_BIG) {
    throw new Error("Angka terlalu besar (melebihi Number.MAX_SAFE_INTEGER).");
  }

  return floored;
}

export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'");
}

export function truncateSentences(text: string, maxSentences: number): string {
  const parts = text
    .replace(/\s+/g, " ")
    .trim()
    .match(/[^.!?]+[.!?]?/g);

  if (!parts) return text.trim();

  return parts.slice(0, maxSentences).join(" ").trim();
}

export function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatNumber(value: number, digits = 4): string {
  return Number(value.toFixed(digits)).toString();
}

export function safeJson<T>(text: string): T {
  return JSON.parse(text) as T;
}
