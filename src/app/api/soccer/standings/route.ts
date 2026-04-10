import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/cache";

const LEAGUES: Record<string, string> = {
  epl: "eng.1",
  laliga: "esp.1",
  bundesliga: "ger.1",
  seriea: "ita.1",
  ligue1: "fra.1",
  mls: "usa.1",
  ucl: "uefa.champions",
};

export async function GET(request: NextRequest) {
  const league = request.nextUrl.searchParams.get("league") ?? "epl";
  if (!(league in LEAGUES)) {
    return NextResponse.json({ error: "Invalid league" }, { status: 400 });
  }
  const slug = LEAGUES[league];

  try {
    const data = await cached(`soccer-standings-${league}`, 60_000, async () => {
      const res = await fetch(`https://site.api.espn.com/apis/v2/sports/soccer/${slug}/standings`);
      if (!res.ok) throw new Error(`ESPN API ${res.status}`);
      return res.json();
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Soccer standings API error" }, { status: 502 });
  }
}
