"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface NBAGame {
  gameId: string;
  gameStatus: number; // 1=scheduled, 2=live, 3=final
  gameStatusText: string;
  gameTimeUTC: string;
  period: number;
  gameClock: string;
  homeTeam: NBATeam;
  awayTeam: NBATeam;
  gameLeaders?: {
    homeLeaders: NBALeader;
    awayLeaders: NBALeader;
  };
}

interface NBATeam {
  teamId: number;
  teamName: string;
  teamCity: string;
  teamTricode: string;
  wins: number;
  losses: number;
  score: number;
  inBonus: string | null;
  timeoutsRemaining: number;
  periods: { period: number; periodType: string; score: number }[];
}

interface NBALeader {
  personId: number;
  name: string;
  jerseyNum: string;
  position: string;
  teamTricode: string;
  points: number;
  rebounds: number;
  assists: number;
}

interface NBABoxscore {
  gameId: string;
  gameStatus: number;
  gameStatusText: string;
  period: number;
  gameClock: string;
  arena: { arenaName: string; arenaCity: string; arenaState: string };
  homeTeam: NBABoxTeam;
  awayTeam: NBABoxTeam;
  officials?: { personId: number; name: string; nameI: string; jerseyNum: string; assignment: string }[];
  attendance?: number;
  duration?: string;
}

interface NBABoxTeam {
  teamId: number;
  teamName: string;
  teamTricode: string;
  score: number;
  inBonus: string | null;
  timeoutsRemaining: number;
  periods: { period: number; score: number }[];
  players: NBAPlayer[];
  statistics: NBATeamStats;
}

interface NBAPlayer {
  status: string;
  personId: number;
  jerseyNum: string;
  position: string;
  starter: string;
  played: string;
  name: string;
  nameI: string;
  firstName: string;
  familyName: string;
  statistics: NBAPlayerStats;
}

interface NBAPlayerStats {
  assists: number;
  blocks: number;
  fieldGoalsAttempted: number;
  fieldGoalsMade: number;
  fieldGoalsPercentage: number;
  foulsPersonal: number;
  freeThrowsAttempted: number;
  freeThrowsMade: number;
  freeThrowsPercentage: number;
  minutes: string;
  minutesCalculated: string;
  plus: number;
  minus: number;
  plusMinusPoints: number;
  points: number;
  reboundsDefensive: number;
  reboundsOffensive: number;
  reboundsTotal: number;
  steals: number;
  threePointersAttempted: number;
  threePointersMade: number;
  threePointersPercentage: number;
  turnovers: number;
}

interface NBATeamStats {
  assists: number;
  blocks: number;
  fieldGoalsAttempted: number;
  fieldGoalsMade: number;
  fieldGoalsPercentage: number;
  foulsPersonal: number;
  freeThrowsAttempted: number;
  freeThrowsMade: number;
  freeThrowsPercentage: number;
  points: number;
  reboundsDefensive: number;
  reboundsOffensive: number;
  reboundsTotal: number;
  steals: number;
  threePointersAttempted: number;
  threePointersMade: number;
  turnovers: number;
}


function formatTime(utc: string): string {
  return new Date(utc).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
}

function periodLabel(p: number): string {
  if (p <= 4) return `Q${p}`;
  return `OT${p - 4}`;
}

function parseMinutes(m: string): string {
  const match = m.match(/PT(\d+)M([\d.]+)S/);
  if (!match) return m;
  return `${match[1]}:${Math.floor(parseFloat(match[2])).toString().padStart(2, "0")}`;
}


export default function NBAGameCard({ game }: { game: NBAGame }) {
  const [box, setBox] = useState<NBABoxscore | null>(null);
  const [statsTeam, setStatsTeam] = useState<"away" | "home" | null>(null);
  const [activeSection, setActiveSection] = useState<"summary" | "stats">("summary");

  const live = game.gameStatus === 2;
  const final_ = game.gameStatus === 3;
  const started = live || final_;

  const gameIdRef = useRef(game.gameId);
  useEffect(() => { gameIdRef.current = game.gameId; }, [game.gameId]);

  const loadBox = useCallback(async () => {
    if (!started) return;
    try {
      const res = await fetch(`/api/nba/boxscore?id=${gameIdRef.current}`);
      if (res.ok) setBox(await res.json());
    } catch { /* silent */ }
  }, [started]);

  useEffect(() => {
    loadBox();
    if (!live) return;
    const iv = setInterval(loadBox, 15000);
    return () => clearInterval(iv);
  }, [loadBox, live]);

  const away = game.awayTeam ?? {} as NBATeam;
  const home = game.homeTeam ?? {} as NBATeam;
  const boxAway = box?.awayTeam;
  const boxHome = box?.homeTeam;
  const arena = box?.arena;

  const tabs = started
    ? (["summary", "stats"] as const)
    : ([] as const);

  return (
    <div className="flex-shrink-0 w-[480px] h-full flex flex-col bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden" role="article" aria-label={`${away.teamTricode ?? "Away"} vs ${home.teamTricode ?? "Home"}`}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        {/* Status */}
        <div className="flex items-center justify-between mb-2" role="status">
          {live ? (
            <div className="flex items-center gap-1.5">
              <span className="live-pulse inline-block w-1.5 h-1.5 rounded-full bg-white" aria-hidden="true" />
              <span className="text-xs text-white font-semibold tracking-wider uppercase">
                Live · {periodLabel(game.period)}
              </span>
            </div>
          ) : final_ ? (
            <span className="text-xs text-muted font-medium tracking-wider uppercase">Final{game.period > 4 ? ` / OT${game.period - 4}` : ""}</span>
          ) : (
            <span className="text-xs text-muted font-medium tracking-wider">{formatTime(game.gameTimeUTC)}</span>
          )}
          {live && game.gameClock && (
            <span className="text-xs text-muted tabular-nums">{game.gameClock}</span>
          )}
        </div>

        {/* Score */}
        <div className="flex items-center justify-center gap-3 py-1">
          <div className="flex items-center gap-2">
            {away.teamId && (
              <Image src={`https://cdn.nba.com/logos/nba/${away.teamId}/global/L/logo.svg`} alt={away.teamTricode ?? ""} width={28} height={28} className="w-7 h-7" unoptimized />
            )}
            <div className="text-right">
              <span className={`text-sm font-bold cursor-default ${final_ && away.score > home.score ? "text-white" : started ? "text-muted" : "text-white"}`} title={`${away.teamCity ?? ""} ${away.teamName ?? ""}`}>{away.teamTricode}</span>
              <div className="text-[11px] text-muted">{away.wins}-{away.losses}</div>
            </div>
          </div>
          {started ? (
            <>
              <span className={`text-xl font-bold tabular-nums ${final_ && away.score > home.score ? "text-white" : "text-muted"}`}>{away.score}</span>
              <span className="text-muted text-sm" aria-hidden="true">-</span>
              <span className={`text-xl font-bold tabular-nums ${final_ && home.score > away.score ? "text-white" : "text-muted"}`}>{home.score}</span>
            </>
          ) : (
            <span className="text-muted text-xs">vs</span>
          )}
          <div className="flex items-center gap-2">
            <div>
              <span className={`text-sm font-bold cursor-default ${final_ && home.score > away.score ? "text-white" : started ? "text-muted" : "text-white"}`} title={`${home.teamCity ?? ""} ${home.teamName ?? ""}`}>{home.teamTricode}</span>
              <div className="text-[11px] text-muted">{home.wins}-{home.losses}</div>
            </div>
            {home.teamId && (
              <Image src={`https://cdn.nba.com/logos/nba/${home.teamId}/global/L/logo.svg`} alt={home.teamTricode ?? ""} width={28} height={28} className="w-7 h-7" unoptimized />
            )}
          </div>
        </div>

        {/* Live info row */}
        {live && (
          <div className="mt-1 flex items-center justify-center gap-4 text-[11px] text-muted">
            {away.inBonus && <span className="text-white/60">{away.teamTricode} bonus</span>}
            {home.inBonus && <span className="text-white/60">{home.teamTricode} bonus</span>}
            <span>TO: {away.timeoutsRemaining}-{home.timeoutsRemaining}</span>
            {boxAway && boxHome && (
              <span>Fouls: {boxAway.statistics?.foulsPersonal ?? 0}-{boxHome.statistics?.foulsPersonal ?? 0}</span>
            )}
          </div>
        )}

        {/* Lead */}
        {started && Math.abs((away.score ?? 0) - (home.score ?? 0)) > 0 && (
          <div className="mt-0.5 text-[11px] text-muted text-center">
            {away.score > home.score
              ? <span>{away.teamTricode} leads by {away.score - home.score}</span>
              : <span>{home.teamTricode} leads by {home.score - away.score}</span>}
          </div>
        )}

        {arena && (
          <div className="mt-1 text-[11px] text-muted text-center">{arena.arenaName}, {arena.arenaCity}</div>
        )}
      </div>

      <div className="mx-5 border-t border-[#1a1a1a]" />

      {/* Tabs */}
      {tabs.length > 0 && (
        <div className="px-5 pt-2 pb-1 flex gap-1" role="tablist">
          {tabs.map((s) => (
            <button key={s} role="tab" aria-selected={activeSection === s} onClick={() => setActiveSection(s)}
              className={`px-2.5 py-1 rounded-md text-[11px] tracking-wider uppercase transition-colors ${activeSection === s ? "bg-white text-black font-bold" : "text-muted hover:text-white"}`}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="card-scroll-area flex-1 overflow-y-auto hide-scrollbar px-5 py-3" role="tabpanel">
        {!started ? (
          <div className="flex flex-col items-center justify-center h-full text-muted text-xs gap-2">
            <span>Tip-off at</span>
            <span className="font-semibold text-white text-sm">{formatTime(game.gameTimeUTC)}</span>
          </div>
        ) : (
          <>
            {activeSection === "summary" && (
              <SummarySection
                away={away} home={home}
                boxAway={boxAway} boxHome={boxHome}
                leaders={game.gameLeaders}
                box={box}
              />
            )}
            {activeSection === "stats" && (
              <PlayerStatsSection
                awayTricode={away.teamTricode}
                homeTricode={home.teamTricode}
                boxAway={boxAway}
                boxHome={boxHome}
                statsTeam={statsTeam}
                setStatsTeam={setStatsTeam}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Summary: quarters + team comparison + leaders + game info ───

function SummarySection({ away, home, boxAway, boxHome, leaders, box }: {
  away: NBATeam; home: NBATeam;
  boxAway?: NBABoxTeam; boxHome?: NBABoxTeam;
  leaders?: NBAGame["gameLeaders"];
  box: NBABoxscore | null;
}) {
  const maxPeriods = Math.max(away.periods?.length ?? 0, home.periods?.length ?? 0);
  const as_ = boxAway?.statistics;
  const hs = boxHome?.statistics;

  return (
    <div className="space-y-4">
      {/* Score by quarter */}
      {maxPeriods > 0 && (
        <div>
          <div className="text-[11px] text-muted tracking-wider uppercase mb-2">Score by Quarter</div>
          <table className="w-full text-xs" role="table">
            <thead>
              <tr className="text-muted">
                <th className="text-left font-medium pb-1 pr-2">Team</th>
                {Array.from({ length: maxPeriods }, (_, i) => (
                  <th key={i} className="text-center font-medium pb-1 px-2 tabular-nums">{periodLabel(i + 1)}</th>
                ))}
                <th className="text-right font-medium pb-1 pl-2">T</th>
              </tr>
            </thead>
            <tbody>
              {[away, home].map((t) => (
                <tr key={t.teamTricode} className="text-white/70">
                  <td className="font-bold pr-2 py-1">{t.teamTricode}</td>
                  {(t.periods ?? []).map((p, i) => <td key={i} className="text-center px-2 tabular-nums">{p.score}</td>)}
                  <td className="text-right font-bold pl-2 tabular-nums">{t.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Game leaders */}
      {leaders && (leaders.awayLeaders?.name || leaders.homeLeaders?.name) && (
        <div>
          <div className="text-[11px] text-muted tracking-wider uppercase mb-1.5">Game Leaders</div>
          <div className="flex gap-2">
            {[leaders.awayLeaders, leaders.homeLeaders].filter(l => l?.name).map((l) => (
              <div key={l.personId} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="text-white font-semibold">{l.name}</span>
                  <span className="text-muted text-xs">{l.teamTricode}</span>
                </div>
                <div className="flex gap-3 mt-1 text-[11px]">
                  <span className="text-white/80"><span className="text-muted">PTS</span> {l.points}</span>
                  <span className="text-white/80"><span className="text-muted">REB</span> {l.rebounds}</span>
                  <span className="text-white/80"><span className="text-muted">AST</span> {l.assists}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team comparison */}
      {as_ && hs && (
        <div>
          <div className="text-[11px] text-muted tracking-wider uppercase mb-2">Team Comparison</div>
          <div className="space-y-1">
            <CompareRow label="FG" away={`${as_.fieldGoalsMade}/${as_.fieldGoalsAttempted}`} home={`${hs.fieldGoalsMade}/${hs.fieldGoalsAttempted}`} awayVal={as_.fieldGoalsPercentage} homeVal={hs.fieldGoalsPercentage} />
            <CompareRow label="FG%" away={`${(as_.fieldGoalsPercentage * 100).toFixed(1)}%`} home={`${(hs.fieldGoalsPercentage * 100).toFixed(1)}%`} awayVal={as_.fieldGoalsPercentage} homeVal={hs.fieldGoalsPercentage} />
            <CompareRow label="3PT" away={`${as_.threePointersMade}/${as_.threePointersAttempted}`} home={`${hs.threePointersMade}/${hs.threePointersAttempted}`} awayVal={as_.threePointersMade} homeVal={hs.threePointersMade} />
            <CompareRow label="FT" away={`${as_.freeThrowsMade}/${as_.freeThrowsAttempted}`} home={`${hs.freeThrowsMade}/${hs.freeThrowsAttempted}`} awayVal={as_.freeThrowsPercentage} homeVal={hs.freeThrowsPercentage} />
            <CompareRow label="REB" away={`${as_.reboundsTotal}`} home={`${hs.reboundsTotal}`} awayVal={as_.reboundsTotal} homeVal={hs.reboundsTotal} />
            <CompareRow label="OREB" away={`${as_.reboundsOffensive}`} home={`${hs.reboundsOffensive}`} awayVal={as_.reboundsOffensive} homeVal={hs.reboundsOffensive} />
            <CompareRow label="AST" away={`${as_.assists}`} home={`${hs.assists}`} awayVal={as_.assists} homeVal={hs.assists} />
            <CompareRow label="STL" away={`${as_.steals}`} home={`${hs.steals}`} awayVal={as_.steals} homeVal={hs.steals} />
            <CompareRow label="BLK" away={`${as_.blocks}`} home={`${hs.blocks}`} awayVal={as_.blocks} homeVal={hs.blocks} />
            <CompareRow label="TO" away={`${as_.turnovers}`} home={`${hs.turnovers}`} awayVal={as_.turnovers} homeVal={hs.turnovers} isLower />
            <CompareRow label="PF" away={`${as_.foulsPersonal}`} home={`${hs.foulsPersonal}`} awayVal={as_.foulsPersonal} homeVal={hs.foulsPersonal} isLower />
          </div>
        </div>
      )}

      {/* Officials */}
      {box?.officials && box.officials.length > 0 && (
        <div>
          <div className="text-[11px] text-muted tracking-wider uppercase mb-1">Officials</div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-white/60">
            {box.officials.map((o) => (
              <span key={o.personId}>#{o.jerseyNum} {o.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* Attendance / duration */}
      <div className="space-y-0.5 text-[11px] text-muted">
        {box?.attendance != null && <div>Attendance: {box.attendance.toLocaleString()}</div>}
        {box?.duration && <div>Duration: {box.duration}</div>}
      </div>
    </div>
  );
}

function CompareRow({ label, away, home, awayVal, homeVal, isLower }: {
  label: string; away: string; home: string;
  awayVal?: number; homeVal?: number; isLower?: boolean;
}) {
  let awayWins = false, homeWins = false;
  if (awayVal !== undefined && homeVal !== undefined) {
    if (isLower) { awayWins = awayVal < homeVal; homeWins = homeVal < awayVal; }
    else { awayWins = awayVal > homeVal; homeWins = homeVal > awayVal; }
  }
  return (
    <div className="flex items-center text-[11px]">
      <span className={`w-16 text-right tabular-nums ${awayWins ? "text-white font-semibold" : "text-white/50"}`}>{away}</span>
      <span className="text-xs text-muted w-2 text-center">{awayWins ? "◀" : ""}</span>
      <span className="flex-1 text-center text-muted text-xs uppercase tracking-wider">{label}</span>
      <span className="text-xs text-muted w-2 text-center">{homeWins ? "▶" : ""}</span>
      <span className={`w-16 text-left tabular-nums ${homeWins ? "text-white font-semibold" : "text-white/50"}`}>{home}</span>
    </div>
  );
}

// ─── Player Stats ───

function PlayerStatsSection({
  awayTricode, homeTricode, boxAway, boxHome, statsTeam, setStatsTeam,
}: {
  awayTricode: string; homeTricode: string;
  boxAway?: NBABoxTeam; boxHome?: NBABoxTeam;
  statsTeam: "away" | "home" | null;
  setStatsTeam: (t: "away" | "home" | null) => void;
}) {
  if (!boxAway || !boxHome) return <div className="text-xs text-muted text-center py-4">No stats available</div>;

  const team = statsTeam === "away" ? boxAway : statsTeam === "home" ? boxHome : null;
  const tricode = statsTeam === "away" ? awayTricode : homeTricode;

  return (
    <div>
      <div className="flex gap-1 mb-3" role="radiogroup" aria-label="Select team">
        {([["away", awayTricode], ["home", homeTricode]] as const).map(([side, code]) => (
          <button key={side} role="radio" aria-checked={statsTeam === side}
            onClick={() => setStatsTeam(statsTeam === side ? null : side)}
            className={`flex-1 py-1.5 rounded-md text-xs font-bold tracking-wider transition-colors ${statsTeam === side ? "bg-white text-black" : "bg-white/5 text-muted hover:text-white border border-white/10"}`}>
            {code}
          </button>
        ))}
      </div>

      {!team ? (
        <div className="text-xs text-muted text-center py-4">Select a team to view player stats</div>
      ) : (
        <div>
          {/* Team totals */}
          <div className="text-[11px] text-muted tracking-wider uppercase mb-1">{tricode} Team Totals</div>
          <div className="grid grid-cols-4 gap-2 text-[11px] mb-3">
            <StatBox label="FG" value={`${team.statistics.fieldGoalsMade}/${team.statistics.fieldGoalsAttempted}`} />
            <StatBox label="3PT" value={`${team.statistics.threePointersMade}/${team.statistics.threePointersAttempted}`} />
            <StatBox label="FT" value={`${team.statistics.freeThrowsMade}/${team.statistics.freeThrowsAttempted}`} />
            <StatBox label="REB" value={`${team.statistics.reboundsTotal}`} />
            <StatBox label="AST" value={`${team.statistics.assists}`} />
            <StatBox label="STL" value={`${team.statistics.steals}`} />
            <StatBox label="BLK" value={`${team.statistics.blocks}`} />
            <StatBox label="TO" value={`${team.statistics.turnovers}`} />
          </div>

          {/* Player table */}
          <div className="text-[11px] text-muted tracking-wider uppercase mb-1">{tricode} Players</div>
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-muted text-left">
                  <th className="font-medium pr-1 pb-1">#</th>
                  <th className="font-medium pr-1 pb-1">Name</th>
                  <th className="font-medium pr-1 pb-1 text-right">MIN</th>
                  <th className="font-medium pr-1 pb-1 text-right">PTS</th>
                  <th className="font-medium pr-1 pb-1 text-right">REB</th>
                  <th className="font-medium pr-1 pb-1 text-right">AST</th>
                  <th className="font-medium pr-1 pb-1 text-right">FG</th>
                  <th className="font-medium pr-1 pb-1 text-right">3P</th>
                  <th className="font-medium pr-1 pb-1 text-right">FT</th>
                  <th className="font-medium pr-1 pb-1 text-right">STL</th>
                  <th className="font-medium pr-1 pb-1 text-right">BLK</th>
                  <th className="font-medium pr-1 pb-1 text-right">TO</th>
                  <th className="font-medium pb-1 text-right">+/-</th>
                </tr>
              </thead>
              <tbody>
                {team.players.filter(p => p.played === "1").map((p) => {
                  const s = p.statistics;
                  const hasOutput = s.points > 0 || s.reboundsTotal > 0 || s.assists > 0;
                  return (
                    <tr key={p.personId} className={hasOutput ? "text-white" : "text-white/50"}>
                      <td className="pr-1 py-0.5 tabular-nums">{p.jerseyNum}</td>
                      <td className="pr-1 py-0.5 whitespace-nowrap">{p.familyName}{p.starter === "1" ? "*" : ""}</td>
                      <td className="pr-1 py-0.5 text-right tabular-nums">{parseMinutes(s.minutesCalculated)}</td>
                      <td className="pr-1 py-0.5 text-right tabular-nums">{s.points}</td>
                      <td className="pr-1 py-0.5 text-right tabular-nums">{s.reboundsTotal}</td>
                      <td className="pr-1 py-0.5 text-right tabular-nums">{s.assists}</td>
                      <td className="pr-1 py-0.5 text-right tabular-nums">{s.fieldGoalsMade}/{s.fieldGoalsAttempted}</td>
                      <td className="pr-1 py-0.5 text-right tabular-nums">{s.threePointersMade}/{s.threePointersAttempted}</td>
                      <td className="pr-1 py-0.5 text-right tabular-nums">{s.freeThrowsMade}/{s.freeThrowsAttempted}</td>
                      <td className="pr-1 py-0.5 text-right tabular-nums">{s.steals}</td>
                      <td className="pr-1 py-0.5 text-right tabular-nums">{s.blocks}</td>
                      <td className="pr-1 py-0.5 text-right tabular-nums">{s.turnovers}</td>
                      <td className="py-0.5 text-right tabular-nums">{s.plusMinusPoints > 0 ? `+${s.plusMinusPoints}` : s.plusMinusPoints}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded px-2 py-1 text-center">
      <div className="text-muted text-xs uppercase">{label}</div>
      <div className="text-white/80 font-medium tabular-nums">{value}</div>
    </div>
  );
}
