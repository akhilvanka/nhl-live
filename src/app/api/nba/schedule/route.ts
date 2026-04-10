import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/cache";
import { isValidDate } from "@/lib/validate";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (!date || !isValidDate(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  try {
    const data = await cached(`nba-schedule-${date}`, 15_000, async () => {
      // Try CDN first (works for today's games)
      try {
        const cdnRes = await fetch(
          "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json",
          { headers: { "User-Agent": "Mozilla/5.0" } }
        );
        if (cdnRes.ok) {
          const cdnData = await cdnRes.json();
          if (cdnData.scoreboard?.gameDate === date) {
            return cdnData.scoreboard;
          }
        }
      } catch { /* fall through */ }

      // For other dates, use stats API
      const res = await fetch(
        `https://stats.nba.com/stats/scoreboardv3?GameDate=${date}&LeagueID=00`,
        {
          headers: {
            "Accept": "application/json, text/plain, */*",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.nba.com/",
            "Origin": "https://www.nba.com",
            "x-nba-stats-origin": "stats",
            "x-nba-stats-token": "true",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        return data.scoreboard;
      }

      // Final fallback
      const fallback = await fetch(
        "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json",
        { headers: { "User-Agent": "Mozilla/5.0" } }
      );
      if (fallback.ok) {
        const data = await fallback.json();
        return data.scoreboard;
      }

      return { games: [] };
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "NBA API error", games: [] }, { status: 200 });
  }
}
