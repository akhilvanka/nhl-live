import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/cache";
import { isValidDate } from "@/lib/validate";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (!date || !isValidDate(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  try {
    const data = await cached(`mlb-schedule-${date}`, 15_000, async () => {
      const url = new URL("https://statsapi.mlb.com/api/v1/schedule");
      url.searchParams.set("sportId", "1");
      url.searchParams.set("date", date);
      url.searchParams.set("hydrate", "linescore,team");
      const res = await fetch(url.toString()
      );
      if (!res.ok) throw new Error(`MLB API ${res.status}`);
      return res.json();
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "MLB API error" }, { status: 502 });
  }
}
