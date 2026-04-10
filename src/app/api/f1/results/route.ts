import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/cache";
import { isValidRound } from "@/lib/validate";

export async function GET(request: NextRequest) {
  const round = request.nextUrl.searchParams.get("round");
  if (!round || !isValidRound(round)) {
    return NextResponse.json({ error: "Invalid round" }, { status: 400 });
  }

  try {
    const data = await cached(`f1-results-${round}`, 30_000, async () => {
      const res = await fetch(`https://api.jolpi.ca/ergast/f1/current/${round}/results.json`);
      if (!res.ok) throw new Error(`F1 API ${res.status}`);
      const json = await res.json();
      return json.MRData?.RaceTable?.Races?.[0] ?? null;
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "F1 API error" }, { status: 502 });
  }
}
