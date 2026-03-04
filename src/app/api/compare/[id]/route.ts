import { NextResponse } from "next/server";
import { coerceTranslation } from "@/lib/bible-api";
import { getComparePayload } from "@/lib/compare";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const params = await context.params;
  const translation = coerceTranslation(new URL(request.url).searchParams.get("translation"));

  const payload = await getComparePayload(params.id, translation);

  if (!payload) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
    },
  });
}

