import { isInstagramConfigured, readInstagramConfig } from "./config";
import { parseInstagramUrl } from "./parseUrl";

export class InstagramNotConnectedError extends Error {
  constructor() {
    super("Instagram connection required");
    this.name = "InstagramNotConnectedError";
  }
}

export class InstagramInvalidUrlError extends Error {
  constructor() {
    super("Invalid or unsupported Instagram URL");
    this.name = "InstagramInvalidUrlError";
  }
}

export class InstagramFetchError extends Error {
  constructor(message = "Could not fetch this Instagram post") {
    super(message);
    this.name = "InstagramFetchError";
  }
}

export interface InstagramPostContent {
  sourceUrl: string;
  caption: string;
  thumbnailUrl: string | null;
  authorName: string | null;
}

/**
 * Fetches metadata for a public Instagram post/reel via the Graph API's
 * oEmbed endpoint (https://developers.facebook.com/docs/graph-api/reference/instagram-oembed/).
 * Requires INSTAGRAM_APP_ID + INSTAGRAM_APP_SECRET — Meta has required an
 * access token on this endpoint for every request since their Oct 2020
 * token-based-access migration; there is no anonymous/public path. The App
 * Access Token (`{app-id}|{app-secret}`) is derived automatically in
 * config.ts — no separate token env var to keep in sync.
 *
 * Callers must check `isInstagramConfigured()` (or catch InstagramNotConnectedError)
 * and surface an honest "not connected" state rather than treating a caught
 * error here as a successful import.
 *
 * Known limitation #1: even with valid credentials, Meta gates the "oEmbed
 * Read" feature behind App Review for content the calling app doesn't own —
 * until that review is approved, expect InstagramFetchError (surfaced as a
 * clean "couldn't read enough information" to the user) for any Reel that
 * isn't posted by an account with a role on this Meta app.
 *
 * Known limitation #2: Instagram's oEmbed response does not include the raw
 * caption text, only an embeddable HTML snippet. We strip tags from that
 * snippet as a best-effort caption for the AI extraction layer. A future
 * upgrade path (once Instagram Graph API permissions are granted) is to
 * call the Graph API media endpoint directly for the real `caption` field.
 */
export async function fetchInstagramPost(url: string): Promise<InstagramPostContent> {
  const parsed = parseInstagramUrl(url);
  if (!parsed) throw new InstagramInvalidUrlError();

  if (!isInstagramConfigured()) throw new InstagramNotConnectedError();

  const { accessToken } = readInstagramConfig();
  const endpoint = new URL("https://graph.facebook.com/v19.0/instagram_oembed");
  endpoint.searchParams.set("url", parsed.canonicalUrl);
  endpoint.searchParams.set("access_token", accessToken!);
  endpoint.searchParams.set("fields", "author_name,thumbnail_url,html");

  let res: Response;
  try {
    res = await fetch(endpoint.toString(), { method: "GET" });
  } catch {
    throw new InstagramFetchError("Network error contacting Instagram.");
  }

  if (!res.ok) {
    // Log Meta's actual error body server-side (e.g. "(#10) oEmbed Read
    // must be reviewed and approved") — invaluable for diagnosing config
    // vs. review-gate vs. bad-URL failures. Never surfaced to the client.
    const body = await res.json().catch(() => null);
    console.error("Instagram oEmbed error:", res.status, body ?? "(no JSON body)");
    throw new InstagramFetchError(`Instagram declined this request (HTTP ${res.status}).`);
  }

  const data = (await res.json()) as { author_name?: string; thumbnail_url?: string; html?: string };
  const caption = (data.html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  return {
    sourceUrl: parsed.canonicalUrl,
    caption,
    thumbnailUrl: data.thumbnail_url ?? null,
    authorName: data.author_name ?? null,
  };
}
