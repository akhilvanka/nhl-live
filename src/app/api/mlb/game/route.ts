import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/cache";
import { isValidId } from "@/lib/validate";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id || !isValidId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const data = await cached(`mlb-game-${id}`, 10_000, async () => {
      const res = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${id}/feed/live`);
      if (!res.ok) throw new Error(`MLB API ${res.status}`);
      return res.json();
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "MLB API error" }, { status: 502 });
  }
}
