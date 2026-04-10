import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/cache";
import { isValidGameId } from "@/lib/validate";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id || !isValidGameId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    // Short TTL (1s) — puck position updates frequently
    const data = await cached(`nhl-pbp-${id}`, 1_000, async () => {
      const res = await fetch(`https://api-web.nhle.com/v1/gamecenter/${id}/play-by-play`);
      if (!res.ok) throw new Error(`NHL API ${res.status}`);
      return res.json();
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "NHL API error" }, { status: 502 });
  }
}
