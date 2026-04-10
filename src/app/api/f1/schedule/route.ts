import { NextResponse } from "next/server";
import { cached } from "@/lib/cache";

export async function GET() {
  try {
    const data = await cached("f1-schedule", 60_000, async () => {
      // Fetch current season schedule + next race + last race results in parallel
      const [schedRes, nextRes, lastRes, standingsRes] = await Promise.all([
        fetch("https://api.jolpi.ca/ergast/f1/current.json"),
        fetch("https://api.jolpi.ca/ergast/f1/current/next.json"),
        fetch("https://api.jolpi.ca/ergast/f1/current/last/results.json"),
        fetch("https://api.jolpi.ca/ergast/f1/current/driverStandings.json"),
      ]);

      const schedule = schedRes.ok ? await schedRes.json() : null;
      const next = nextRes.ok ? await nextRes.json() : null;
      const last = lastRes.ok ? await lastRes.json() : null;
      const standings = standingsRes.ok ? await standingsRes.json() : null;

      return {
        races: schedule?.MRData?.RaceTable?.Races ?? [],
        nextRace: next?.MRData?.RaceTable?.Races?.[0] ?? null,
        lastRace: last?.MRData?.RaceTable?.Races?.[0] ?? null,
        lastResults: last?.MRData?.RaceTable?.Races?.[0]?.Results ?? [],
        standings: standings?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [],
        season: schedule?.MRData?.RaceTable?.season ?? "",
      };
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "F1 API error" }, { status: 502 });
  }
}
