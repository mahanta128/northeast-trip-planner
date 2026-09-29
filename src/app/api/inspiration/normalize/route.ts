import { NextRequest, NextResponse } from "next/server";
import { extractManualLocation, LocationExtractionError } from "@/lib/extraction/locations";
import type { InspirationLocation } from "@/lib/inspiration/types";

/**
 * "Can't find your place? Add it manually" — runs a user-typed place name
 * through the same extraction + normalization pipeline as every other
 * inspiration source, so it ends up in an identical shape before the user
 * reviews/saves it.
 */

export interface NormalizeLocationResponse {
  status: "success" | "invalid_name" | "error";
  message: string;
  location?: InspirationLocation;
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
    const location = await extractManualLocation(name);
    return NextResponse.json<NormalizeLocationResponse>({
      status: "success",
      message: `Added ${location.name}.`,
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
