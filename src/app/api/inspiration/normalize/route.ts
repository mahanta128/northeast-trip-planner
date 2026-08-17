import { NextRequest, NextResponse } from "next/server";
import { normalizeManualLocation, LocationExtractionError } from "@/lib/extraction/locations";
import type { ExtractedLocation } from "@/lib/inspiration/types";

/**
 * "Can't find your place? Add it manually" — runs a user-typed place name
 * through the same normalization used for AI-detected (Instagram) locations,
 * so both end up in an identical shape before the user reviews/saves them.
 */

export interface NormalizeLocationResponse {
  status: "success" | "invalid_name" | "error";
  message: string;
  location?: ExtractedLocation;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({ name: undefined }));
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json<NormalizeLocationResponse>(
      { status: "invalid_name", message: "Enter a place name to add it." },
      { status: 400 }
    );
  }
  if (name.length > 200) {
    return NextResponse.json<NormalizeLocationResponse>(
      { status: "invalid_name", message: "That place name is too long." },
      { status: 400 }
    );
  }

  try {
    const location = await normalizeManualLocation(name);
    return NextResponse.json<NormalizeLocationResponse>({
      status: "success",
      message: `Added ${location.locationName}.`,
      location,
    });
  } catch (err) {
    if (err instanceof LocationExtractionError) {
      return NextResponse.json<NormalizeLocationResponse>(
        { status: "error", message: "Could not add this place right now." },
        { status: 500 }
      );
    }
    console.error("inspiration normalize error:", err);
    return NextResponse.json<NormalizeLocationResponse>(
      { status: "error", message: "Something went wrong adding this place." },
      { status: 500 }
    );
  }
}
