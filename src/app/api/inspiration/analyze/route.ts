import { NextRequest, NextResponse } from "next/server";
import {
  extractLocationsFromImage,
  extractLocationsFromText,
  LocationExtractionError,
} from "@/lib/extraction/locations";
import type { ExtractedLocation } from "@/lib/inspiration/types";

/**
 * Powers Import Inspiration's two AI-driven input methods — "Upload Screenshot"
 * and "Paste Caption / Notes". Both end up calling the same server-side OpenAI
 * extraction layer; this route just picks which one based on what was sent.
 *
 * No Meta/Instagram API involved here. An Instagram link is never fetched —
 * it is only ever a source reference the client attaches to whatever the
 * screenshot/notes extraction below actually found. See
 * src/lib/integrations/instagram/parseUrl.ts for the (network-free) URL
 * validation used on that path.
 */

const ACCEPTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // 6MB — generous for a screenshot, small enough to stay under serverless body limits once base64-encoded.
const MAX_NOTES_LENGTH = 4000;

export type AnalyzeInspirationStatus =
  | "success"
  | "no_locations"
  | "invalid_input"
  | "unsupported_file"
  | "file_too_large"
  | "error";

export interface AnalyzeInspirationResponse {
  status: AnalyzeInspirationStatus;
  message: string;
  nextStep?: string;
  locations?: ExtractedLocation[];
}

function successOrEmpty(locations: ExtractedLocation[], emptyMessage: string, emptyNextStep: string) {
  if (locations.length === 0) {
    return NextResponse.json<AnalyzeInspirationResponse>({
      status: "no_locations",
      message: emptyMessage,
      nextStep: emptyNextStep,
    });
  }
  return NextResponse.json<AnalyzeInspirationResponse>({
    status: "success",
    message: `Found ${locations.length} place${locations.length === 1 ? "" : "s"}.`,
    locations,
  });
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

  try {
    // ── Screenshot path ──────────────────────────────────────────
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData().catch(() => null);
      const file = form?.get("image");

      if (!file || !(file instanceof File)) {
        return NextResponse.json<AnalyzeInspirationResponse>(
          { status: "invalid_input", message: "Please choose a screenshot to upload." },
          { status: 400 }
        );
      }

      if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
        return NextResponse.json<AnalyzeInspirationResponse>(
          {
            status: "unsupported_file",
            message: "That file type isn't supported.",
            nextStep: "Upload a PNG, JPG or WEBP screenshot, or paste the caption instead.",
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json<AnalyzeInspirationResponse>(
          {
            status: "file_too_large",
            message: "That image is too large.",
            nextStep: "Try a screenshot under 6MB, or paste the caption instead.",
          },
          { status: 400 }
        );
      }

      // Processed in memory only — never written to disk, discarded once
      // this request completes.
      const buffer = Buffer.from(await file.arrayBuffer());
      const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

      const locations = await extractLocationsFromImage({ dataUrl });
      return successOrEmpty(
        locations,
        "We couldn't confidently identify any places from this screenshot.",
        "Paste the caption instead, or add a place manually."
      );
    }

    // ── Caption / notes path ─────────────────────────────────────
    const body = await req.json().catch(() => ({ notes: undefined }));
    const notes = typeof body?.notes === "string" ? body.notes.trim() : "";

    if (!notes) {
      return NextResponse.json<AnalyzeInspirationResponse>(
        { status: "invalid_input", message: "Paste a caption or a few notes to get started." },
        { status: 400 }
      );
    }
    if (notes.length > MAX_NOTES_LENGTH) {
      return NextResponse.json<AnalyzeInspirationResponse>(
        { status: "invalid_input", message: `Please keep notes under ${MAX_NOTES_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const locations = await extractLocationsFromText({ text: notes, sourceType: "notes" });
    return successOrEmpty(
      locations,
      "We couldn't confidently identify any places from your notes.",
      "Try adding a bit more detail, or add a place manually."
    );
  } catch (err) {
    if (err instanceof LocationExtractionError) {
      console.error("inspiration analyze: extraction failed:", err.message);
      return NextResponse.json<AnalyzeInspirationResponse>(
        {
          status: "error",
          message: "We couldn't analyze this right now.",
          nextStep: "Please try again, or add a place manually.",
        },
        { status: 502 }
      );
    }
    // Never leak a raw stack trace or provider error to the client.
    console.error("inspiration analyze error:", err);
    return NextResponse.json<AnalyzeInspirationResponse>(
      {
        status: "error",
        message: "Something went wrong analyzing your inspiration.",
        nextStep: "Please try again, or add a place manually.",
      },
      { status: 500 }
    );
  }
}
