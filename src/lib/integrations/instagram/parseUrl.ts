export interface ParsedInstagramUrl {
  shortcode: string;
  kind: "p" | "reel" | "tv";
  canonicalUrl: string;
}

const INSTAGRAM_URL_RE = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)\/?/i;

/** Validates and normalises an Instagram post/reel/IGTV URL. Returns null if unsupported. */
export function parseInstagramUrl(raw: string): ParsedInstagramUrl | null {
  const trimmed = raw.trim();
  const match = trimmed.match(INSTAGRAM_URL_RE);
  if (!match) return null;

  const kind = match[2] as "p" | "reel" | "tv";
  const shortcode = match[3]!;

  return {
    shortcode,
    kind,
    canonicalUrl: `https://www.instagram.com/${kind}/${shortcode}/`,
  };
}
