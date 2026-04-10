import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/cache";
import { isValidId } from "@/lib/validate";

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
  const eventId = request.nextUrl.searchParams.get("id");
  const league = request.nextUrl.searchParams.get("league") ?? "epl";
  if (!eventId || !isValidId(eventId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  if (!(league in LEAGUES)) {
    return NextResponse.json({ error: "Invalid league" }, { status: 400 });
  }

  const slug = LEAGUES[league];

  try {
    const data = await cached(`soccer-match-${eventId}`, 30_000, async () => {
      const url = new URL(`https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/summary`);
      url.searchParams.set("event", eventId);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`ESPN API ${res.status}`);
      return res.json();
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Soccer match API error" }, { status: 502 });
  }
}
