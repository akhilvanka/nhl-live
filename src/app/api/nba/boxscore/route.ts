import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/cache";
import { isValidGameId } from "@/lib/validate";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id || !isValidGameId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const data = await cached(`nba-box-${id}`, 10_000, async () => {
      const res = await fetch(
        `https://cdn.nba.com/static/json/liveData/boxscore/boxscore_${id}.json`,
        { headers: { "User-Agent": "Mozilla/5.0" } }
      );
      if (!res.ok) throw new Error(`NBA API ${res.status}`);
      const json = await res.json();
      return json.game;
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "NBA API error" }, { status: 502 });
  }
}
