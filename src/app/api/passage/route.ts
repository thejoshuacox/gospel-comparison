import { NextResponse } from "next/server";
import { coerceTranslation, getPassage } from "@/lib/bible-api";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");
  const translation = coerceTranslation(searchParams.get("translation"));

  if (!ref) {
    return NextResponse.json({ error: "Missing required query parameter 'ref'." }, { status: 400 });
  }

  try {
    const passage = await getPassage(ref, translation);
    return NextResponse.json(passage, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load passage.",
      },
      { status: 502 },
    );
  }
}

