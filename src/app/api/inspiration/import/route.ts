import { NextRequest, NextResponse } from "next/server";
import {
  fetchInstagramPost,
  parseInstagramUrl,
  isInstagramConfigured,
  InstagramNotConnectedError,
  InstagramInvalidUrlError,
  InstagramFetchError,
} from "@/lib/integrations/instagram";
import { extractLocationsFromText, LocationExtractionError } from "@/lib/extraction/locations";
import type { ExtractedLocation } from "@/lib/inspiration/types";

export type ImportInspirationStatus =
  | "success"
  | "not_connected"
  | "invalid_url"
  | "fetch_failed"
  | "no_locations"
  | "extraction_failed";

export interface ImportInspirationResponse {
  status: ImportInspirationStatus;
  message: string;
  sourceUrl?: string;
  locations?: ExtractedLocation[];
  nextStep?: string;
}

const NOT_CONNECTED: ImportInspirationResponse = {
  status: "not_connected",
  message: "Instagram connection required.",
  nextStep:
    "Add INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET to your environment, then restart the app, to enable live Instagram imports.",
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({ url: undefined }));
  const url = typeof body?.url === "string" ? body.url.trim() : "";

  if (!url) {
    return NextResponse.json<ImportInspirationResponse>(
      { status: "invalid_url", message: "Please enter a valid Instagram link." },
      { status: 400 }
    );
  }

  const parsed = parseInstagramUrl(url);
  if (!parsed) {
    return NextResponse.json<ImportInspirationResponse>(
      { status: "invalid_url", message: "Please enter a valid Instagram link." },
      { status: 400 }
    );
  }

  // Check this up front so we never attempt a network call we know will fail,
  // and so the UI can show "Instagram connection required" instead of a generic error.
  if (!isInstagramConfigured()) {
    return NextResponse.json<ImportInspirationResponse>({ ...NOT_CONNECTED, sourceUrl: parsed.canonicalUrl });
  }

  try {
    const post = await fetchInstagramPost(parsed.canonicalUrl);
    const locations = await extractLocationsFromText({ caption: post.caption, sourceUrl: post.sourceUrl });

    if (locations.length === 0) {
      return NextResponse.json<ImportInspirationResponse>({
        status: "no_locations",
        message: "We couldn't read enough information from this Instagram link.",
        nextStep: "Try another public Reel or add the places manually.",
        sourceUrl: post.sourceUrl,
      });
    }

    return NextResponse.json<ImportInspirationResponse>({
      status: "success",
      message: `Found ${locations.length} place${locations.length === 1 ? "" : "s"}.`,
      sourceUrl: post.sourceUrl,
      locations,
    });
  } catch (err) {
    if (err instanceof InstagramNotConnectedError) {
      return NextResponse.json<ImportInspirationResponse>({ ...NOT_CONNECTED, sourceUrl: parsed.canonicalUrl });
    }
    if (err instanceof InstagramInvalidUrlError) {
      return NextResponse.json<ImportInspirationResponse>(
        { status: "invalid_url", message: "Please enter a valid Instagram link." },
        { status: 400 }
      );
    }
    if (err instanceof InstagramFetchError) {
      console.error("inspiration import: Instagram fetch failed:", err.message);
      return NextResponse.json<ImportInspirationResponse>(
        {
          status: "fetch_failed",
          message: "We couldn't read enough information from this Instagram link.",
          nextStep: "Try another public Reel or add the places manually.",
          sourceUrl: parsed.canonicalUrl,
        },
        { status: 502 }
      );
    }
    if (err instanceof LocationExtractionError) {
      console.error("inspiration import: location extraction failed:", err.message);
      return NextResponse.json<ImportInspirationResponse>(
        {
          status: "extraction_failed",
          message: "We couldn't read enough information from this Instagram link.",
          nextStep: "Try another public Reel or add the places manually.",
          sourceUrl: parsed.canonicalUrl,
        },
        { status: 500 }
      );
    }
    console.error("inspiration import error:", err);
    return NextResponse.json<ImportInspirationResponse>(
      {
        status: "fetch_failed",
        message: "We couldn't read enough information from this Instagram link.",
        nextStep: "Try another public Reel or add the places manually.",
        sourceUrl: parsed.canonicalUrl,
      },
      { status: 500 }
    );
  }
}
