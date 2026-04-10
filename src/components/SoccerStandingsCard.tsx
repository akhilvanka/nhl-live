"use client";

import { useEffect, useState, useCallback } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

function str(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object" && "name" in (val as any)) return String((val as any).name ?? "");
  return "";
}

function getStat(stats: any[], name: string): string {
  const s = stats?.find((x: any) => x.name === name);
  return s?.displayValue ?? "—";
}

function getStatNum(stats: any[], name: string): number {
  const s = stats?.find((x: any) => x.name === name);
  return s?.value ?? 0;
}

const LEAGUE_LABELS: Record<string, string> = {
  epl: "Premier League",
  laliga: "La Liga",
  bundesliga: "Bundesliga",
  seriea: "Serie A",
  ligue1: "Ligue 1",
  mls: "MLS",
  ucl: "Champions League",
};

export default function SoccerStandingsCard({ league }: { league: string }) {
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/soccer/standings?league=${league}`);
      if (res.ok) {
        const d = await res.json();
        setStandings(d.children?.[0]?.standings?.entries ?? []);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [league]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex-shrink-0 w-96 h-full flex items-center justify-center bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl">
        <span className="text-muted text-xs">Loading table...</span>
      </div>
    );
  }

  const sorted = [...standings].sort((a, b) => getStatNum(a.stats, "rank") - getStatNum(b.stats, "rank"));
  const maxPts = sorted.length > 0 ? getStatNum(sorted[0].stats, "points") : 1;

  return (
    <div className="flex-shrink-0 w-96 h-full flex flex-col bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden" role="article" aria-label={`${LEAGUE_LABELS[league] ?? league} Standings`}>
      <div className="px-4 pt-3 pb-2">
        <div className="text-xs font-bold text-white tracking-wider uppercase">{LEAGUE_LABELS[league] ?? league} Table</div>
      </div>
      <div className="mx-4 border-t border-[#1a1a1a]" />
      <div className="card-scroll-area flex-1 overflow-y-auto hide-scrollbar px-4 py-2">
        {sorted.length === 0 ? (
          <div className="text-xs text-muted text-center py-4">No standings available</div>
        ) : (
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-muted text-left">
                <th className="font-medium pb-1 w-3 text-center"></th>
                <th className="font-medium pb-1 w-6 text-center">#</th>
                <th className="font-medium pb-1">Team</th>
                <th className="font-medium pb-1 text-center w-6">P</th>
                <th className="font-medium pb-1 text-center w-6">W</th>
                <th className="font-medium pb-1 text-center w-6">D</th>
                <th className="font-medium pb-1 text-center w-6">L</th>
                <th className="font-medium pb-1 text-right w-8">GD</th>
                <th className="font-medium pb-1 text-right w-8">Pts</th>
                <th className="font-medium pb-1 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry: any) => {
                const rank = getStat(entry.stats, "rank");
                const name = str(entry.team?.abbreviation) || str(entry.team?.name)?.slice(0, 3).toUpperCase();
                const fullName = str(entry.team?.displayName) || str(entry.team?.name);
                const gp = getStat(entry.stats, "gamesPlayed");
                const w = getStat(entry.stats, "wins");
                const d = getStat(entry.stats, "ties");
                const l = getStat(entry.stats, "losses");
                const gd = getStat(entry.stats, "pointDifferential");
                const pts = getStat(entry.stats, "points");
                const ptsNum = getStatNum(entry.stats, "points");
                const barW = maxPts > 0 ? (ptsNum / maxPts) * 100 : 0;
                const noteColor = entry.note?.color;
                const pos = parseInt(rank);

                return (
                  <tr key={entry.team?.id ?? rank} className={pos <= 4 ? "text-white" : pos >= 18 ? "text-red-400/70" : "text-white/60"}>
                    <td className="py-0.5 text-center">
                      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: noteColor ?? "transparent" }} />
                    </td>
                    <td className="py-0.5 text-center tabular-nums">{rank}</td>
                    <td className="py-0.5 whitespace-nowrap font-medium" title={fullName}>{name}</td>
                    <td className="py-0.5 text-center tabular-nums text-muted">{gp}</td>
                    <td className="py-0.5 text-center tabular-nums">{w}</td>
                    <td className="py-0.5 text-center tabular-nums text-muted">{d}</td>
                    <td className="py-0.5 text-center tabular-nums text-muted">{l}</td>
                    <td className="py-0.5 text-right tabular-nums text-xs">{gd}</td>
                    <td className="py-0.5 text-right tabular-nums font-bold">{pts}</td>
                    <td className="py-0.5 pl-1">
                      <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${barW}%`, backgroundColor: noteColor ?? "#fff" }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
