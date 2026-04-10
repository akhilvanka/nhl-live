import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/cache";
import { isValidDate } from "@/lib/validate";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (!date || !isValidDate(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  try {
    const data = await cached(`nhl-schedule-${date}`, 15_000, async () => {
      const res = await fetch(`https://api-web.nhle.com/v1/schedule/${date}`);
      if (!res.ok) throw new Error(`NHL API ${res.status}`);
      return res.json();
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "NHL API error" }, { status: 502 });
  }
}
