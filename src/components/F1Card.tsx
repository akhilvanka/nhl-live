"use client";

import { useEffect, useState, useCallback } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── F1 Constructor colors ───
const TEAM_COLORS: Record<string, string> = {
  mercedes: "#27F4D2", ferrari: "#E80020", mclaren: "#FF8000",
  red_bull: "#3671C6", alpine: "#FF87BC", aston_martin: "#229971",
  williams: "#64C4FF", haas: "#B6BABD", rb: "#6692FF",
  sauber: "#52E252", racing_bulls: "#6692FF",
};

function teamColor(constructorId?: string): string {
  if (!constructorId) return "#555";
  return TEAM_COLORS[constructorId] ?? "#555";
}

// ─── SVG Track paths ───
const TRACK_PATHS: Record<string, string> = {
  bahrain: "M60,140 L60,80 Q60,50 90,50 L180,50 Q210,50 210,80 L210,100 L250,100 L250,130 L210,130 L210,160 Q210,190 180,190 L90,190 Q60,190 60,160 Z",
  jeddah: "M40,170 L40,60 Q40,40 60,40 L100,40 L120,60 L140,40 L200,40 Q220,40 220,60 L220,100 L200,120 L220,140 L220,170 Q220,190 200,190 L60,190 Q40,190 40,170 Z",
  albert_park: "M80,160 Q50,140 50,110 L50,80 Q50,50 80,50 L160,50 Q200,50 220,80 L230,120 Q230,150 200,170 L160,180 Q120,190 80,160 Z",
  suzuka: "M40,120 Q40,60 80,50 L140,50 Q180,50 200,70 L220,100 Q240,120 220,140 L180,160 Q160,170 140,160 L120,140 Q100,120 80,140 L60,170 Q40,180 40,150 Z",
  monaco: "M60,170 L60,100 Q60,60 80,50 L160,40 Q200,40 220,60 L230,80 L210,100 L230,120 L220,150 Q210,180 180,190 L100,190 Q70,190 60,170 Z",
  silverstone: "M60,140 L60,80 Q60,50 90,50 L110,50 L130,30 L170,30 L190,50 L220,50 Q250,50 250,80 L250,120 L230,140 L250,160 Q250,190 220,190 L90,190 Q60,190 60,160 Z",
  spa: "M40,160 L40,80 L70,50 Q90,30 110,50 L130,80 L150,60 L190,60 Q220,60 240,80 L260,120 Q260,150 240,170 L200,190 L100,190 Q60,190 40,170 Z",
  monza: "M80,180 Q50,170 50,140 L50,80 Q50,40 90,30 L200,30 Q240,30 250,60 L260,100 Q260,140 240,160 L200,180 Q160,200 120,190 Z",
  miami: "M60,160 L60,80 Q60,50 90,50 L200,50 Q230,50 230,80 L230,120 L200,140 L230,160 Q230,190 200,190 L90,190 Q60,190 60,160 Z",
  americas: "M50,150 L50,80 Q50,40 90,40 L130,40 L160,60 L190,40 L230,40 Q260,40 260,80 L260,150 Q260,190 220,190 L90,190 Q50,190 50,150 Z",
  interlagos: "M80,170 Q50,150 50,120 L60,80 Q70,40 110,40 L190,50 Q230,60 240,90 L240,140 Q240,180 200,190 L120,190 Q90,190 80,170 Z",
  yas_marina: "M60,150 L60,80 Q60,50 90,50 L180,50 Q210,50 220,70 L240,100 Q250,130 230,150 L200,170 Q180,190 150,190 L90,190 Q60,190 60,170 Z",
  shanghai: "M50,140 L50,80 Q50,40 90,40 L130,40 L150,60 L180,40 L220,40 Q250,40 250,80 L250,120 L230,140 L250,160 Q250,190 220,190 L90,190 Q50,190 50,160 Z",
};

function getTrackPath(circuitId: string): string {
  return TRACK_PATHS[circuitId] ?? TRACK_PATHS["silverstone"];
}

function formatDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatSessionDate(d: string, t?: string): string {
  if (!t) return formatDate(d);
  const dt = new Date(`${d}T${t}`);
  return dt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
}

interface F1Data {
  races: any[];
  nextRace: any;
  lastRace: any;
  lastResults: any[];
  standings: any[];
  season: string;
}

// Find the race whose weekend contains the given date (race day ± 3 days)
function findRaceForDate(races: any[], date: string): any | null {
  const target = new Date(date + "T00:00:00").getTime();
  for (const r of races) {
    const raceDay = new Date(r.date + "T00:00:00").getTime();
    const diff = Math.abs(target - raceDay);
    if (diff <= 3 * 86400000) return r; // within 3 days
  }
  return null;
}

export default function F1Card({ date }: { date?: string }) {
  const [data, setData] = useState<F1Data | null>(null);
  const [qualiData, setQualiData] = useState<any>(null);
  const [selectedResults, setSelectedResults] = useState<any[] | null>(null);
  const [selectedRace, setSelectedRace] = useState<any>(null);
  const [constructorStandings, setConstructorStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"race" | "qualifying" | "drivers" | "constructors" | "schedule">("race");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [schedRes, standingsRes] = await Promise.all([
        fetch("/api/f1/schedule"),
        fetch("/api/f1/standings"),
      ]);
      if (schedRes.ok) {
        const d = await schedRes.json();
        setData(d);

        // If a date is provided, find the race for that date
        const matchedRace = date ? findRaceForDate(d.races ?? [], date) : null;
        const targetRound = matchedRace?.round ?? d.lastRace?.round;

        if (targetRound) {
          // Fetch results and qualifying for the target round
          const [resRes, qRes] = await Promise.all([
            fetch(`/api/f1/results?round=${targetRound}`),
            fetch(`/api/f1/qualifying?round=${targetRound}`),
          ]);
          if (resRes.ok) {
            const rData = await resRes.json();
            setSelectedResults(rData?.Results ?? []);
            setSelectedRace(rData ?? matchedRace ?? d.lastRace);
          } else {
            setSelectedResults([]);
            setSelectedRace(matchedRace ?? d.lastRace);
          }
          if (qRes.ok) setQualiData(await qRes.json());
        } else {
          setSelectedResults([]);
          setSelectedRace(d.nextRace);
        }
      }
      if (standingsRes.ok) {
        const s = await standingsRes.json();
        setConstructorStandings(s.constructors ?? []);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [date]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex-shrink-0 w-full min-w-[900px] h-full flex items-center justify-center bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl">
        <span className="text-muted text-xs">Loading F1...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-shrink-0 w-full min-w-[900px] h-full flex items-center justify-center bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl">
        <span className="text-muted text-xs">No F1 data available</span>
      </div>
    );
  }

  const { nextRace, lastRace, standings } = data;
  const raceResults = selectedResults ?? data.lastResults ?? [];
  const activeRace = selectedRace ?? lastRace ?? nextRace;
  const displayRace = activeRace;
  const circuitId = displayRace?.Circuit?.circuitId ?? "silverstone";
  const qualiResults = qualiData?.QualifyingResults ?? [];

  // Compute analytics
  const completedRaces = data.races.filter((r: any) => parseInt(r.round) <= parseInt(lastRace?.round ?? "0"));
  const totalRaces = data.races.length;
  const topGainer = raceResults.length > 0
    ? raceResults.reduce((best: any, r: any) => {
        const gain = parseInt(r.grid) - parseInt(r.position);
        return gain > (best.gain ?? -999) ? { ...r, gain } : best;
      }, { gain: -999 })
    : null;
  const FINISHED_STATUSES = ["Finished", "Lapped", "Not classified"];
  const dnfs = raceResults.filter((r: any) =>
    r.status && !FINISHED_STATUSES.includes(r.status) && !r.status.startsWith("+")
  );
  const fastestLapDriver = raceResults.find((r: any) => r.FastestLap?.rank === "1");

  return (
    <div className="flex-shrink-0 w-full min-w-[900px] h-full flex flex-col bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden" role="article" aria-label="Formula 1">
      {/* Header */}
      <div className="px-6 pt-4 pb-3 space-y-3">
        {/* Row 1: Title + next race */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white tracking-wider uppercase">Formula 1</span>
            <span className="text-xs text-muted">{data.season} Season · {completedRaces.length}/{totalRaces} races</span>
          </div>
          {nextRace && (
            <span className="text-[11px] text-muted">
              Next: {nextRace.raceName} · {formatDate(nextRace.date)}
            </span>
          )}
        </div>

        {/* Row 2: Track + race info */}
        {displayRace && (
          <div className="flex items-center gap-5">
            <div className="flex-shrink-0">
              <TrackSVG circuitId={circuitId} />
            </div>
            <div className="flex-shrink-0">
              <div className="text-sm font-bold text-white">{displayRace.raceName}</div>
              <div className="text-[11px] text-muted">
                {displayRace.Circuit?.Location?.locality}, {displayRace.Circuit?.Location?.country} · R{displayRace.round} · {formatDate(displayRace.date)}
              </div>
            </div>

            {/* Podium */}
            {raceResults.length > 0 && (
              <div className="flex gap-2 ml-4">
                {raceResults.slice(0, 3).map((r: any) => (
                  <div key={r.position} className="bg-white/5 border border-white/10 rounded px-3 py-1.5">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="font-bold text-white/60">P{r.position}</span>
                      <span className="font-bold" style={{ color: teamColor(r.Constructor?.constructorId) }}>{r.Driver?.code ?? r.Driver?.familyName}</span>
                    </div>
                    <div className="text-xs text-muted tabular-nums">{r.Time?.time ?? r.status}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Divider */}
            <div className="h-8 w-px bg-[#1a1a1a] mx-2" />

            {/* Compact stats row */}
            <div className="flex gap-5 text-[11px]">
              {fastestLapDriver && (
                <div>
                  <div className="text-muted text-[11px] tracking-wider uppercase">FL</div>
                  <span style={{ color: teamColor(fastestLapDriver.Constructor?.constructorId) }}>{fastestLapDriver.Driver?.code}</span>
                  <span className="text-muted ml-1">{fastestLapDriver.FastestLap?.Time?.time}</span>
                </div>
              )}
              {topGainer && topGainer.gain > 0 && (
                <div>
                  <div className="text-muted text-[11px] tracking-wider uppercase">Mover</div>
                  <span style={{ color: teamColor(topGainer.Constructor?.constructorId) }}>{topGainer.Driver?.code}</span>
                  <span className="text-green-400 ml-1">▲{topGainer.gain}</span>
                </div>
              )}
              {dnfs.length > 0 && (
                <div>
                  <div className="text-muted text-[11px] tracking-wider uppercase">DNF</div>
                  <span className="text-white/70">{dnfs.length}</span>
                </div>
              )}
              {standings.length > 0 && (
                <div>
                  <div className="text-muted text-[11px] tracking-wider uppercase">Leader</div>
                  <span style={{ color: teamColor(standings[0].Constructors?.[0]?.constructorId) }}>{standings[0].Driver?.code}</span>
                  <span className="text-white/70 ml-1">{standings[0].points}pts</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mx-5 border-t border-[#1a1a1a]" />

      {/* Tabs */}
      <div className="px-5 pt-2 pb-1 flex gap-1" role="tablist">
        {(["race", "qualifying", "drivers", "constructors", "schedule"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={activeTab === t} onClick={() => setActiveTab(t)}
            className={`px-2.5 py-1 rounded-md text-[11px] tracking-wider uppercase transition-colors ${activeTab === t ? "bg-white text-black font-bold" : "text-muted hover:text-white"}`}>
            {t === "race" ? "results" : t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="card-scroll-area flex-1 overflow-y-auto hide-scrollbar px-5 py-3" role="tabpanel">
        {activeTab === "race" && (
          <RaceResultsSection results={raceResults} race={activeRace} />
        )}
        {activeTab === "qualifying" && (
          <QualifyingSection results={qualiResults} race={activeRace} />
        )}
        {activeTab === "drivers" && (
          <StandingsSection standings={standings} />
        )}
        {activeTab === "constructors" && (
          <ConstructorsSection standings={constructorStandings} />
        )}
        {activeTab === "schedule" && (
          <ScheduleSection races={data.races} lastRound={parseInt(lastRace?.round ?? "0")} />
        )}
      </div>
    </div>
  );
}

// ─── Track SVG ───

function TrackSVG({ circuitId }: { circuitId: string }) {
  const path = getTrackPath(circuitId);
  return (
    <svg width="140" height="110" viewBox="0 0 300 220" aria-label={`${circuitId} circuit`}>
      <rect width="300" height="220" rx="12" fill="#0a0a0a" />
      <path d={path} fill="none" stroke="#333" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d={path} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <circle cx="60" cy="140" r="4" fill="#e00" />
    </svg>
  );
}

// ─── Race Results with Position Timeline ───

function RaceResultsSection({ results, race }: { results: any[]; race: any }) {
  if (!results || results.length === 0) {
    return <div className="text-xs text-muted text-center py-4">No race results yet — check back after the race</div>;
  }

  return (
    <div className="flex gap-6">
      {/* Position Timeline */}
      <div className="flex-shrink-0">
        <div className="text-[11px] text-muted tracking-wider uppercase mb-2">Grid → Finish</div>
        <PositionTimeline results={results} />
      </div>

      {/* Results table */}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-muted tracking-wider uppercase mb-2">
          {race?.raceName ?? "Race"} Results
        </div>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted text-left">
              <th className="font-medium pb-1 w-6 text-center">Pos</th>
              <th className="font-medium pb-1">#</th>
              <th className="font-medium pb-1">Driver</th>
              <th className="font-medium pb-1">Team</th>
              <th className="font-medium pb-1 text-right">Grid</th>
              <th className="font-medium pb-1 text-right">+/-</th>
              <th className="font-medium pb-1 text-right">Time</th>
              <th className="font-medium pb-1 text-right">Pts</th>
              <th className="font-medium pb-1 text-right">FL</th>
              <th className="font-medium pb-1 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r: any) => {
              const cId = r.Constructor?.constructorId;
              const gridDiff = parseInt(r.grid) - parseInt(r.position);
              const isFastestLap = r.FastestLap?.rank === "1";
              return (
                <tr key={r.position} className={parseInt(r.position) <= 3 ? "text-white" : "text-white/60"}>
                  <td className="py-0.5 text-center tabular-nums font-bold">{r.position}</td>
                  <td className="py-0.5 tabular-nums" style={{ color: teamColor(cId) }}>{r.number}</td>
                  <td className="py-0.5 whitespace-nowrap">
                    {r.Driver?.givenName?.[0]}. {r.Driver?.familyName}
                  </td>
                  <td className="py-0.5 text-xs" style={{ color: teamColor(cId) + "99" }}>{r.Constructor?.name}</td>
                  <td className="py-0.5 text-right tabular-nums text-muted">{r.grid}</td>
                  <td className="py-0.5 text-right tabular-nums text-xs">
                    {gridDiff > 0 && <span className="text-green-400">▲{gridDiff}</span>}
                    {gridDiff < 0 && <span className="text-red-400">▼{Math.abs(gridDiff)}</span>}
                    {gridDiff === 0 && <span className="text-muted">—</span>}
                  </td>
                  <td className="py-0.5 text-right tabular-nums text-xs">{r.Time?.time ?? "—"}</td>
                  <td className="py-0.5 text-right tabular-nums">{r.points}</td>
                  <td className="py-0.5 text-right tabular-nums text-xs">
                    {isFastestLap ? <span className="text-purple-400">{r.FastestLap?.Time?.time}</span> : (r.FastestLap?.Time?.time ?? "—")}
                  </td>
                  <td className="py-0.5 text-right text-xs text-muted">{r.status === "Finished" || r.status === "Lapped" ? "" : r.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Position Timeline SVG ───

function PositionTimeline({ results }: { results: any[] }) {
  const drivers = results.slice(0, 20);
  const w = 280;
  const h = Math.max(160, drivers.length * 14 + 30);
  const leftMargin = 40;
  const rightMargin = 40;
  const topPad = 15;
  const rowH = (h - topPad - 10) / Math.max(drivers.length, 1);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: 400, minWidth: 200 }}>
      <rect width={w} height={h} rx="6" fill="#0a0a0a" />

      {/* Column headers */}
      <text x={leftMargin} y={10} fill="#555" fontSize="7" fontFamily="monospace">GRID</text>
      <text x={w - rightMargin} y={10} fill="#555" fontSize="7" fontFamily="monospace" textAnchor="end">FINISH</text>

      {/* Grid lines */}
      <line x1={leftMargin} y1={topPad} x2={leftMargin} y2={h - 5} stroke="#1a1a1a" strokeWidth="0.5" />
      <line x1={w - rightMargin} y1={topPad} x2={w - rightMargin} y2={h - 5} stroke="#1a1a1a" strokeWidth="0.5" />

      {drivers.map((r: any, i: number) => {
        const grid = parseInt(r.grid) || (i + 1);
        const finish = parseInt(r.position);
        const cId = r.Constructor?.constructorId;
        const color = teamColor(cId);

        const gridY = topPad + (grid - 1) * rowH + rowH / 2;
        const finishY = topPad + (finish - 1) * rowH + rowH / 2;
        const gained = grid - finish;

        return (
          <g key={r.position}>
            <line
              x1={leftMargin + 5} y1={gridY}
              x2={w - rightMargin - 5} y2={finishY}
              stroke={color}
              strokeWidth="1.5"
              opacity={finish <= 10 ? 0.7 : 0.3}
            />
            <circle cx={leftMargin} cy={gridY} r="3" fill={color} opacity="0.5" />
            <circle cx={w - rightMargin} cy={finishY} r="3.5" fill={color} />
            <text x={leftMargin - 5} y={gridY + 3} fill="#555" fontSize="7" fontFamily="monospace" textAnchor="end">P{grid}</text>
            <text x={w - rightMargin + 5} y={finishY + 3} fill={color} fontSize="7" fontFamily="monospace">
              {r.Driver?.code ?? ""}
              {gained !== 0 && (
                <tspan fill={gained > 0 ? "#4ade80" : "#f87171"} fontSize="6">
                  {` ${gained > 0 ? "+" : ""}${gained}`}
                </tspan>
              )}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Qualifying ───

function QualifyingSection({ results, race }: { results: any[]; race: any }) {
  if (!results || results.length === 0) {
    return <div className="text-xs text-muted text-center py-4">No qualifying data — check back after qualifying</div>;
  }

  return (
    <div>
      <div className="text-[11px] text-muted tracking-wider uppercase mb-2">
        {race?.raceName ?? "Race"} Qualifying
      </div>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-muted text-left">
            <th className="font-medium pb-1 w-6 text-center">Pos</th>
            <th className="font-medium pb-1">#</th>
            <th className="font-medium pb-1">Driver</th>
            <th className="font-medium pb-1">Team</th>
            <th className="font-medium pb-1 text-right">Q1</th>
            <th className="font-medium pb-1 text-right">Q2</th>
            <th className="font-medium pb-1 text-right">Q3</th>
            <th className="font-medium pb-1 text-right">Gap</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r: any, i: number) => {
            const cId = r.Constructor?.constructorId;
            const pos = parseInt(r.position);
            // Calculate gap to pole
            const poleTime = results[0]?.Q3 ?? results[0]?.Q2 ?? results[0]?.Q1;
            const thisTime = r.Q3 ?? r.Q2 ?? r.Q1;
            let gap = "—";
            if (i > 0 && poleTime && thisTime) {
              const poleMs = timeToMs(poleTime);
              const thisMs = timeToMs(thisTime);
              if (poleMs > 0 && thisMs > 0) gap = `+${((thisMs - poleMs) / 1000).toFixed(3)}`;
            }
            return (
              <tr key={r.position} className={pos <= 3 ? "text-white" : pos <= 10 ? "text-white/70" : "text-white/40"}>
                <td className="py-0.5 text-center tabular-nums font-bold">{r.position}</td>
                <td className="py-0.5 tabular-nums" style={{ color: teamColor(cId) }}>{r.number}</td>
                <td className="py-0.5 whitespace-nowrap">{r.Driver?.givenName?.[0]}. {r.Driver?.familyName}</td>
                <td className="py-0.5 text-xs" style={{ color: teamColor(cId) + "99" }}>{r.Constructor?.name}</td>
                <td className="py-0.5 text-right tabular-nums text-xs">{r.Q1 ?? "—"}</td>
                <td className="py-0.5 text-right tabular-nums text-xs">{r.Q2 ?? "—"}</td>
                <td className="py-0.5 text-right tabular-nums text-xs font-semibold">{r.Q3 ?? "—"}</td>
                <td className="py-0.5 text-right tabular-nums text-xs text-muted">{i === 0 ? "POLE" : gap}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function timeToMs(t: string): number {
  const parts = t.split(":");
  if (parts.length === 2) return parseFloat(parts[0]) * 60000 + parseFloat(parts[1]) * 1000;
  return parseFloat(t) * 1000;
}

// ─── Driver Standings ───

function StandingsSection({ standings }: { standings: any[] }) {
  if (!standings || standings.length === 0) {
    return <div className="text-xs text-muted text-center py-4">No standings data</div>;
  }

  const leader = parseInt(standings[0]?.points ?? "0");

  return (
    <div>
      <div className="text-[11px] text-muted tracking-wider uppercase mb-2">Driver Championship</div>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-muted text-left">
            <th className="font-medium pb-1 w-6 text-center">Pos</th>
            <th className="font-medium pb-1">Driver</th>
            <th className="font-medium pb-1">Team</th>
            <th className="font-medium pb-1 text-right">Wins</th>
            <th className="font-medium pb-1 text-right">Pts</th>
            <th className="font-medium pb-1 text-right">Gap</th>
            <th className="font-medium pb-1 w-32"></th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s: any, i: number) => {
            const cId = s.Constructors?.[0]?.constructorId;
            const pts = parseInt(s.points ?? "0");
            const gap = pts - leader;
            const pos = parseInt(s.position);
            const barW = leader > 0 ? (pts / leader) * 100 : 0;
            // Gap to driver ahead
            const gapAhead = i > 0 ? pts - parseInt(standings[i - 1]?.points ?? "0") : 0;

            return (
              <tr key={s.position} className={pos <= 3 ? "text-white" : "text-white/60"}>
                <td className="py-0.5 text-center tabular-nums font-bold">{s.position}</td>
                <td className="py-0.5 whitespace-nowrap">
                  <span style={{ color: teamColor(cId) }}>{s.Driver?.code ?? s.Driver?.familyName}</span>
                  <span className="text-muted text-xs ml-1">{s.Driver?.givenName?.[0]}. {s.Driver?.familyName}</span>
                </td>
                <td className="py-0.5 text-xs" style={{ color: teamColor(cId) + "99" }}>{s.Constructors?.[0]?.name}</td>
                <td className="py-0.5 text-right tabular-nums">{s.wins}</td>
                <td className="py-0.5 text-right tabular-nums font-bold">{s.points}</td>
                <td className="py-0.5 text-right tabular-nums text-muted text-xs">
                  {gap === 0 ? "—" : gap}
                  {gapAhead < 0 && <span className="text-muted text-[11px] ml-0.5">({gapAhead})</span>}
                </td>
                <td className="py-0.5 pl-2">
                  <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${barW}%`, backgroundColor: teamColor(cId) }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Constructor Standings ───

function ConstructorsSection({ standings }: { standings: any[] }) {
  if (!standings || standings.length === 0) {
    return <div className="text-xs text-muted text-center py-4">No constructor standings data</div>;
  }

  const leader = parseInt(standings[0]?.points ?? "0");

  return (
    <div>
      <div className="text-[11px] text-muted tracking-wider uppercase mb-2">Constructor Championship</div>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-muted text-left">
            <th className="font-medium pb-1 w-6 text-center">Pos</th>
            <th className="font-medium pb-1">Constructor</th>
            <th className="font-medium pb-1 text-right">Wins</th>
            <th className="font-medium pb-1 text-right">Pts</th>
            <th className="font-medium pb-1 text-right">Gap</th>
            <th className="font-medium pb-1 w-40"></th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s: any) => {
            const cId = s.Constructor?.constructorId;
            const pts = parseInt(s.points ?? "0");
            const gap = pts - leader;
            const pos = parseInt(s.position);
            const barW = leader > 0 ? (pts / leader) * 100 : 0;

            return (
              <tr key={s.position} className={pos <= 3 ? "text-white" : "text-white/60"}>
                <td className="py-0.5 text-center tabular-nums font-bold">{s.position}</td>
                <td className="py-0.5 whitespace-nowrap" style={{ color: teamColor(cId) }}>
                  {s.Constructor?.name}
                </td>
                <td className="py-0.5 text-right tabular-nums">{s.wins}</td>
                <td className="py-0.5 text-right tabular-nums font-bold">{s.points}</td>
                <td className="py-0.5 text-right tabular-nums text-muted text-xs">{gap === 0 ? "—" : gap}</td>
                <td className="py-0.5 pl-2">
                  <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${barW}%`, backgroundColor: teamColor(cId) }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Schedule ───

function ScheduleSection({ races, lastRound }: { races: any[]; lastRound: number }) {
  return (
    <div>
      <div className="text-[11px] text-muted tracking-wider uppercase mb-2">Season Calendar</div>
      <div className="space-y-1">
        {races.map((r: any) => {
          const round = parseInt(r.round);
          const isPast = round <= lastRound;
          const isNext = round === lastRound + 1;
          const hasSprint = !!r.Sprint;

          return (
            <div key={r.round} className={`flex items-center gap-3 text-[11px] px-2 py-1 rounded ${isNext ? "bg-white/5 border border-white/10" : ""}`}>
              <span className="text-muted tabular-nums w-5 text-right">{r.round}</span>
              <span className={`flex-1 ${isPast ? "text-white/40" : isNext ? "text-white font-semibold" : "text-white/70"}`}>
                {r.raceName}
                {hasSprint && <span className="text-[11px] text-muted ml-1">SPRINT</span>}
              </span>
              <span className="text-muted text-xs w-28">{r.Circuit?.circuitName}</span>
              <span className="text-muted tabular-nums text-xs">{formatDate(r.date)}</span>
              <span className="text-muted text-xs w-12 text-right">
                {r.Circuit?.Location?.country?.slice(0, 3).toUpperCase()}
              </span>
              {isPast && <span className="text-[11px] text-white/20">✓</span>}
              {isNext && <span className="text-[11px] text-white">→</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
