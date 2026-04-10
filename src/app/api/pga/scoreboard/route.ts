import { NextResponse } from "next/server";
import { cached } from "@/lib/cache";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET() {
  try {
    const result = await cached("pga-scoreboard", 30_000, async () => {
      const res = await fetch(
        "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard",
        { headers: { "User-Agent": "Mozilla/5.0" } }
      );
      if (!res.ok) throw new Error(`ESPN API ${res.status}`);
      const data = await res.json();

      const events = (data.events ?? []).map((ev: any) => {
        const comp = ev.competitions?.[0];
        const status = comp?.status ?? ev.status;
        const currentRound = status?.period ?? 1;

        const competitors = (comp?.competitors ?? []).map((c: any) => {
          const currentRoundData = c.linescores?.[currentRound - 1];
          const holeScores = (currentRoundData?.linescores ?? []).map((h: any) => ({
            hole: h.period,
            strokes: h.value,
            displayValue: h.displayValue,
            toPar: h.scoreType?.displayValue ?? "E",
          }));

          return {
            id: c.id,
            name: c.athlete?.fullName ?? c.athlete?.displayName ?? "Unknown",
            shortName: c.athlete?.shortName ?? "",
            country: c.athlete?.flag?.alt ?? "",
            countryFlag: c.athlete?.flag?.href ?? "",
            score: c.score ?? "E",
            today: currentRoundData?.displayValue ?? null,
            thru: holeScores.length || null,
            holeScores,
            linescores: (c.linescores ?? []).map((ls: any) => ({
              round: ls.period,
              value: ls.value ?? null,
              displayValue: ls.displayValue ?? null,
            })),
          };
        });

        return {
          id: ev.id,
          name: ev.name ?? ev.shortName,
          shortName: ev.shortName,
          date: ev.date,
          endDate: ev.endDate,
          status: {
            state: status?.type?.state ?? "pre",
            detail: status?.type?.detail ?? "",
            shortDetail: status?.type?.shortDetail ?? "",
            completed: status?.type?.completed ?? false,
            period: currentRound,
          },
          broadcast: comp?.broadcast ?? ev.broadcast ?? "",
          competitors,
          venue: comp?.venue?.fullName ?? "",
          course: comp?.venue?.address?.summary ?? "",
        };
      });

      return { events };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to fetch PGA data", events: [] }, { status: 200 });
  }
}
