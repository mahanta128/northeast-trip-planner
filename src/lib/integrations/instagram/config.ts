/**
 * Server-only environment config for the Instagram integration.
 * Never import this from a "use client" component — it reads process.env
 * and is only meant to run inside API routes / server code.
 */

export interface InstagramEnvConfig {
  appId: string | null;
  appSecret: string | null;
  /**
   * Meta's Instagram oEmbed endpoint has required an access token for every
   * request since Meta's Oct 2020 token-based-access migration — there is
   * no anonymous/public path. This is derived, not user-supplied: it's the
   * standard Meta "App Access Token" format (`{app-id}|{app-secret}`),
   * documented for server-to-server calls exactly like this one. (There's a
   * separate "Client Access Token" format — `{app-id}|{client-token}` —
   * meant for browser/mobile contexts; that one is NOT what we want here,
   * since this call only ever happens server-side.)
   */
  accessToken: string | null;
}

export function readInstagramConfig(): InstagramEnvConfig {
  const appId = process.env.INSTAGRAM_APP_ID || null;
  const appSecret = process.env.INSTAGRAM_APP_SECRET || null;
  return {
    appId,
    appSecret,
    accessToken: appId && appSecret ? `${appId}|${appSecret}` : null,
  };
}

/** True once both INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET are set — that's
 *  all that's needed; the App Access Token is derived from them. */
export function isInstagramConfigured(): boolean {
  return Boolean(readInstagramConfig().accessToken);
}
