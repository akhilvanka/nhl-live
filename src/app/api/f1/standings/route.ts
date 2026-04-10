import { NextResponse } from "next/server";
import { cached } from "@/lib/cache";

export async function GET() {
  try {
    const data = await cached("f1-standings", 60_000, async () => {
      const [dRes, cRes] = await Promise.all([
        fetch("https://api.jolpi.ca/ergast/f1/current/driverStandings.json"),
        fetch("https://api.jolpi.ca/ergast/f1/current/constructorStandings.json"),
      ]);
      const drivers = dRes.ok ? await dRes.json() : null;
      const constructors = cRes.ok ? await cRes.json() : null;
      return {
        drivers: drivers?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [],
        constructors: constructors?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? [],
      };
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "F1 API error" }, { status: 502 });
  }
}
