import { NextResponse } from "next/server";
import { listEvents, listSections } from "@/lib/events";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get("q") ?? undefined;
  const section = searchParams.get("section") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? "50");
  const offset = Number(searchParams.get("offset") ?? "0");

  const result = listEvents({
    q,
    section,
    limit: Number.isFinite(limit) ? limit : 50,
    offset: Number.isFinite(offset) ? offset : 0,
  });

  return NextResponse.json(
    {
      total: result.total,
      items: result.items,
      sections: listSections(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}

