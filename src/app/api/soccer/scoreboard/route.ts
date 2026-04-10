import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/cache";
import { isValidDate } from "@/lib/validate";

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
  const date = request.nextUrl.searchParams.get("date");
  if (!(league in LEAGUES)) {
    return NextResponse.json({ error: "Invalid league" }, { status: 400 });
  }
  if (date && !isValidDate(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const slug = LEAGUES[league];

  try {
    const data = await cached(`soccer-${league}-${date ?? "today"}`, 30_000, async () => {
      const url = new URL(`https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard`);
      if (date) url.searchParams.set("dates", date.replace(/-/g, ""));
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`ESPN API ${res.status}`);
      return res.json();
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Soccer API error" }, { status: 502 });
  }
}
