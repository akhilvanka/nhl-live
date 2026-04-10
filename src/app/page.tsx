"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { NHLGame, NHLScheduleDay } from "@/lib/types";
import GameCard from "@/components/GameCard";
import NBAGameCard from "@/components/NBAGameCard";
import MLBGameCard from "@/components/MLBGameCard";
import GolfCard from "@/components/GolfCard";
import F1Card from "@/components/F1Card";
import SoccerCard from "@/components/SoccerCard";
import SoccerStandingsCard from "@/components/SoccerStandingsCard";
import DatePicker from "@/components/DatePicker";

type Sport = "nhl" | "nba" | "mlb" | "pga" | "f1" | "soccer";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

/* eslint-disable @typescript-eslint/no-explicit-any */

const SOCCER_LEAGUES = ["epl", "laliga", "bundesliga", "seriea", "ligue1", "mls", "ucl"] as const;
const SOCCER_LEAGUE_LABELS: Record<string, string> = {
  epl: "EPL", laliga: "La Liga", bundesliga: "BL", seriea: "Serie A", ligue1: "L1", mls: "MLS", ucl: "UCL",
};

export default function Home() {
  const [sport, setSport] = useState<Sport>("nhl");
  const [date, setDate] = useState(todayStr);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameCount, setGameCount] = useState(0);
  const [hasLive, setHasLive] = useState(false);
  const [soccerLeague, setSoccerLeague] = useState<string>("epl");
  const scrollRef = useRef<HTMLDivElement>(null);

  const isRefresh = useRef(false);

  const loadSchedule = useCallback(async (s: Sport, d: string, sLeague?: string) => {
    if (!isRefresh.current) {
      setLoading(true);
      setError(null);
    }
    try {
      if (s === "nhl") {
        const res = await fetch(`/api/schedule?date=${d}`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const day: NHLScheduleDay | undefined = data.gameWeek?.find((w: NHLScheduleDay) => w.date === d);
        const g = day?.games ?? [];
        setGames(g);
        setGameCount(g.length);
        setHasLive(g.some((x: NHLGame) => x.gameState === "LIVE" || x.gameState === "CRIT"));
      } else if (s === "nba") {
        const res = await fetch(`/api/nba/schedule?date=${d}`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const g = data.games ?? [];
        setGames(g);
        setGameCount(g.length);
        setHasLive(g.some((x: any) => x.gameStatus === 2));
      } else if (s === "mlb") {
        const res = await fetch(`/api/mlb/schedule?date=${d}`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const g = data.dates?.[0]?.games ?? [];
        setGames(g);
        setGameCount(g.length);
        setHasLive(g.some((x: any) => x.status?.abstractGameState === "Live"));
      } else if (s === "pga") {
        const res = await fetch("/api/pga/scoreboard");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const g = data.events ?? [];
        setGames(g);
        setGameCount(g.length);
        setHasLive(g.some((x: any) => x.status?.state === "in"));
      } else if (s === "f1") {
        setGames(["f1"]);
        setGameCount(1);
        setHasLive(false);
      } else if (s === "soccer") {
        const league = sLeague ?? "epl";
        const res = await fetch(`/api/soccer/scoreboard?league=${league}&date=${d}`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const g = data.events ?? [];
        setGames(g);
        setGameCount(g.length);
        setHasLive(g.some((x: any) => x.competitions?.[0]?.status?.type?.state === "in"));
      }
      setError(null);
    } catch {
      if (!isRefresh.current) {
        setError("Could not load schedule");
        setGames([]);
        setGameCount(0);
        setHasLive(false);
      }
    }
    setLoading(false);
    isRefresh.current = true;
  }, []);

  useEffect(() => {
    isRefresh.current = false;
    loadSchedule(sport, date, soccerLeague);
  }, [sport, date, soccerLeague, loadSchedule]);

  // Horizontal wheel scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      const target = e.target as HTMLElement;
      const scrollable = target.closest(".card-scroll-area");
      if (scrollable) {
        const s = scrollable as HTMLElement;
        const atTop = s.scrollTop === 0;
        const atBottom = s.scrollTop + s.clientHeight >= s.scrollHeight - 1;
        if (!(atTop && e.deltaY < 0) && !(atBottom && e.deltaY > 0)) return;
      }
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el!.scrollLeft += e.deltaY;
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Auto-refresh live games
  useEffect(() => {
    if (!hasLive) return;
    const iv = setInterval(() => loadSchedule(sport, date, soccerLeague), 30000);
    return () => clearInterval(iv);
  }, [hasLive, sport, date, soccerLeague, loadSchedule]);

  const sportLabels: Record<Sport, string> = { nhl: "NHL", nba: "NBA", mlb: "MLB", pga: "PGA", f1: "F1", soccer: "Soccer" };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-black">
      {/* Header */}
      <header className="flex-shrink-0 px-6 pt-4 pb-2 flex items-center justify-between">
        <div>
          {/* Sport toggle */}
          <div className="flex gap-1 mb-1" role="tablist" aria-label="Sport selector">
            {(["nhl", "nba", "mlb", "pga", "f1", "soccer"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={sport === s}
                onClick={() => setSport(s)}
                className={`px-3 py-1 rounded-md text-xs font-bold tracking-wider transition-colors ${
                  sport === s ? "bg-white text-black" : "text-muted hover:text-white"
                }`}
              >
                {sportLabels[s]}
              </button>
            ))}
          </div>

          {/* Soccer league sub-selector */}
          {sport === "soccer" && (
            <div className="flex gap-1 mb-1" role="tablist" aria-label="League selector">
              {SOCCER_LEAGUES.map((l) => (
                <button
                  key={l}
                  role="tab"
                  aria-selected={soccerLeague === l}
                  onClick={() => setSoccerLeague(l)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wider transition-colors ${
                    soccerLeague === l ? "bg-white/20 text-white" : "text-muted hover:text-white"
                  }`}
                >
                  {SOCCER_LEAGUE_LABELS[l]}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Cards */}
      <main ref={scrollRef} className={`flex-1 flex gap-4 px-6 pb-16 overflow-x-auto hide-scrollbar items-stretch transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"}`}>
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-muted text-xs">{error}</span>
          </div>
        ) : games.length === 0 && sport !== "soccer" ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-muted text-xs">No games scheduled</span>
          </div>
        ) : (
          <>
            {/* Soccer: standings card first, then match cards */}
            {sport === "soccer" && <SoccerStandingsCard key={`standings-${soccerLeague}`} league={soccerLeague} />}

            {games.length === 0 && sport === "soccer" ? (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-muted text-xs">No matches on this date</span>
              </div>
            ) : (
              games.map((game: any, i: number) => {
                if (sport === "nhl") return <GameCard key={game.id ?? i} game={game} />;
                if (sport === "nba") return <NBAGameCard key={game.gameId || i} game={game} />;
                if (sport === "mlb") return <MLBGameCard key={typeof game.gamePk === "object" ? game.gamePk?.id ?? i : game.gamePk ?? i} game={game} />;
                if (sport === "pga") return <GolfCard key={game.id ?? i} event={game} />;
                if (sport === "f1") return <F1Card key={`f1-${i}`} date={date} />;
                if (sport === "soccer") return <SoccerCard key={game.id ?? i} event={game} league={soccerLeague} />;
                return null;
              })
            )}
          </>
        )}
      </main>

      {/* Date pill */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <DatePicker date={date} onChange={setDate} />
      </div>
    </div>
  );
}
