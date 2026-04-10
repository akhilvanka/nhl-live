"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import DiamondSVG from "./DiamondSVG";

/* eslint-disable @typescript-eslint/no-explicit-any */

function formatTime(utc: string): string {
  return new Date(utc).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
}

function teamAbbr(entry: any): string {
  return entry?.team?.abbreviation || entry?.team?.name?.split(" ").pop()?.substring(0, 3).toUpperCase() || "???";
}

function shortName(fullName: string): string {
  const parts = fullName.split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ") : fullName;
}

interface MLBGameCardProps {
  game: any;
}

export default function MLBGameCard({ game }: MLBGameCardProps) {
  const [liveData, setLiveData] = useState<any>(null);
  const [statsTeam, setStatsTeam] = useState<"away" | "home" | null>(null);
  const [activeSection, setActiveSection] = useState<"situation" | "summary" | "stats">("situation");
  const gamePkRef = useRef(game.gamePk);

  const isLive = game.status?.abstractGameState === "Live";
  const isFinal = game.status?.abstractGameState === "Final";
  const started = isLive || isFinal;

  const loadData = useCallback(async () => {
    if (!started) return;
    try {
      const res = await fetch(`/api/mlb/game?id=${gamePkRef.current}`);
      if (res.ok) setLiveData(await res.json());
    } catch { /* silent */ }
  }, [started]);

  useEffect(() => {
    gamePkRef.current = game.gamePk;
  }, [game.gamePk]);

  useEffect(() => {
    loadData();
    if (!isLive) return;
    const iv = setInterval(loadData, 15000);
    return () => clearInterval(iv);
  }, [loadData, isLive]);

  // If finished and no situation to show, default to scoring
  useEffect(() => {
    if (isFinal && activeSection === "situation") setActiveSection("summary");
  }, [isFinal, activeSection]);

  const away = game.teams?.away;
  const home = game.teams?.home;
  const awayAbbr = teamAbbr(away);
  const homeAbbr = teamAbbr(home);

  const ld = liveData?.liveData;
  const gd = liveData?.gameData;
  const ls = ld?.linescore ?? game.linescore;
  const boxscore = ld?.boxscore;
  const decisions = ld?.decisions;
  const plays = ld?.plays;
  const weather = gd?.weather;
  const gameInfo = gd?.gameInfo;
  const probablePitchers = gd?.probablePitchers;
  const officials = boxscore?.officials;
  const boxInfo = boxscore?.info;

  // Current situation
  const offense = ls?.offense;
  const defense = ls?.defense;
  const onFirst = !!offense?.first;
  const onSecond = !!offense?.second;
  const onThird = !!offense?.third;
  const balls = ls?.balls ?? 0;
  const strikes = ls?.strikes ?? 0;
  const outs = ls?.outs ?? 0;
  const inning = ls?.currentInning ?? 0;
  const isTopInning = ls?.isTopInning ?? true;

  // Scoring plays
  const allPlays = plays?.allPlays ?? [];
  const scoringPlayIds: number[] = plays?.scoringPlays ?? [];
  const scoringPlays = scoringPlayIds.map((idx: number) => allPlays[idx]).filter(Boolean);

  // Runs/Hits/Errors
  const awayRHE = ls?.teams?.away;
  const homeRHE = ls?.teams?.home;
  const awayScore = away?.score ?? awayRHE?.runs ?? 0;
  const homeScore = home?.score ?? homeRHE?.runs ?? 0;

  const tabs = isLive
    ? ["situation", "summary", "stats"] as const
    : ["summary", "stats"] as const;

  return (
    <div className="flex-shrink-0 w-[480px] h-full flex flex-col bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden" role="article" aria-label={`${awayAbbr} vs ${homeAbbr}`}>
      <div className="px-5 pt-4 pb-3">
        {/* Status */}
        <div className="flex items-center justify-between mb-2" role="status">
          {isLive ? (
            <div className="flex items-center gap-1.5">
              <span className="live-pulse inline-block w-1.5 h-1.5 rounded-full bg-white" aria-hidden="true" />
              <span className="text-xs text-white font-semibold tracking-wider uppercase">
                Live · {ls?.inningState} {ls?.currentInningOrdinal}
              </span>
            </div>
          ) : isFinal ? (
            <span className="text-xs text-muted font-medium tracking-wider uppercase">{game.status?.detailedState ?? "Final"}</span>
          ) : (
            <span className="text-xs text-muted font-medium tracking-wider">{formatTime(game.gameDate)}</span>
          )}
          {isLive && (
            <span className="text-xs text-muted tabular-nums">{balls}-{strikes}, {outs} out{outs !== 1 ? "s" : ""}</span>
          )}
        </div>

        {/* Score */}
        <div className="flex items-center justify-center gap-3 py-1">
          <div className="flex items-center gap-2">
            {away?.team?.id && (
              <Image src={`https://www.mlbstatic.com/team-logos/${away.team.id}.svg`} alt={awayAbbr} width={28} height={28} className="w-7 h-7" unoptimized />
            )}
            <div className="text-right">
              <span className={`text-sm font-bold cursor-default ${isFinal && awayScore > homeScore ? "text-white" : started ? "text-muted" : "text-white"}`} title={away?.team?.name ?? awayAbbr}>{awayAbbr}</span>
              <div className="text-[11px] text-muted">{away?.leagueRecord?.wins}-{away?.leagueRecord?.losses}</div>
            </div>
          </div>
          {started ? (
            <>
              <span className={`text-xl font-bold tabular-nums ${isFinal && awayScore > homeScore ? "text-white" : "text-muted"}`}>{awayScore}</span>
              <span className="text-muted text-sm" aria-hidden="true">-</span>
              <span className={`text-xl font-bold tabular-nums ${isFinal && homeScore > awayScore ? "text-white" : "text-muted"}`}>{homeScore}</span>
            </>
          ) : (
            <span className="text-muted text-xs">vs</span>
          )}
          <div className="flex items-center gap-2">
            <div>
              <span className={`text-sm font-bold cursor-default ${isFinal && homeScore > awayScore ? "text-white" : started ? "text-muted" : "text-white"}`} title={home?.team?.name ?? homeAbbr}>{homeAbbr}</span>
              <div className="text-[11px] text-muted">{home?.leagueRecord?.wins}-{home?.leagueRecord?.losses}</div>
            </div>
            {home?.team?.id && (
              <Image src={`https://www.mlbstatic.com/team-logos/${home.team.id}.svg`} alt={homeAbbr} width={28} height={28} className="w-7 h-7" unoptimized />
            )}
          </div>
        </div>

        {/* R/H/E */}
        {started && awayRHE && homeRHE && (
          <div className="mt-1 flex items-center justify-center gap-4 text-[11px] text-muted">
            <span>H: {awayRHE.hits}-{homeRHE.hits}</span>
            <span>E: {awayRHE.errors}-{homeRHE.errors}</span>
          </div>
        )}

        {/* Decisions */}
        {isFinal && decisions && (
          <div className="mt-1.5 flex items-center justify-center gap-3 text-[11px] text-muted">
            {decisions.winner && (
              <span title="Winning pitcher">
                <span className="text-white/40">Win</span> <span className="text-white/70">{decisions.winner.fullName}</span>
              </span>
            )}
            {decisions.loser && (
              <span title="Losing pitcher">
                <span className="text-white/40">Loss</span> <span className="text-white/70">{decisions.loser.fullName}</span>
              </span>
            )}
            {decisions.save && (
              <span title="Save — pitcher who finished the game preserving the lead">
                <span className="text-white/40">Save</span> <span className="text-white/70">{decisions.save.fullName}</span>
              </span>
            )}
          </div>
        )}

        {/* Venue & Gameday link */}
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted">
          <span>{game.venue?.name}</span>
          {game.gamePk && (
            <a
              href={`https://www.mlb.com/gameday/${game.gamePk}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
              title="Open MLB Gameday — includes radio broadcast"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a5 5 0 0 0-5 5v4.5a2.5 2.5 0 0 0 2.5 2.5h1a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-.5-.5H5V6a3 3 0 1 1 6 0v2h-1.5a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 .5.5h1A2.5 2.5 0 0 0 13 10.5V6a5 5 0 0 0-5-5z"/></svg>
              Gameday
            </a>
          )}
        </div>
      </div>

      <div className="mx-5 border-t border-[#1a1a1a]" />

      {/* Tabs */}
      {started && (
        <div className="px-5 pt-2 pb-1 flex gap-1" role="tablist">
          {tabs.map((s) => (
            <button key={s} role="tab" aria-selected={activeSection === s} onClick={() => setActiveSection(s)}
              className={`px-2.5 py-1 rounded-md text-[11px] tracking-wider uppercase transition-colors ${activeSection === s ? "bg-white text-black font-bold" : "text-muted hover:text-white"}`}>
              {s === "situation" ? "live" : s}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="card-scroll-area flex-1 overflow-y-auto hide-scrollbar px-5 py-3" role="tabpanel">
        {!started ? (
          <PreGameInfo game={game} probablePitchers={probablePitchers} />
        ) : (
          <>
            {activeSection === "situation" && isLive && (
              <SituationSection
                onFirst={onFirst} onSecond={onSecond} onThird={onThird}
                balls={balls} strikes={strikes} outs={outs}
                inning={inning} isTopInning={isTopInning}
                offense={offense} defense={defense}
                currentPlay={plays?.currentPlay}
                officials={officials}
                gameInfo={gameInfo}
                weather={weather}
              />
            )}
            {activeSection === "summary" && (
              <SummarySection
                ls={ls} scoringPlays={scoringPlays}
                awayAbbr={awayAbbr} homeAbbr={homeAbbr}
                officials={officials} gameInfo={gameInfo}
                decisions={decisions} weather={weather}
                probablePitchers={probablePitchers}
                awayTeamEntry={away} homeTeamEntry={home}
              />
            )}
            {activeSection === "stats" && (
              <StatsSection
                awayAbbr={awayAbbr} homeAbbr={homeAbbr}
                boxAway={boxscore?.teams?.away} boxHome={boxscore?.teams?.home}
                statsTeam={statsTeam} setStatsTeam={setStatsTeam}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Pre-game ───

function PreGameInfo({ game, probablePitchers }: { game: any; probablePitchers?: any }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted text-xs gap-2">
      <span>First pitch at</span>
      <span className="font-semibold text-white text-sm">{formatTime(game.gameDate)}</span>
      <span>{game.venue?.name}</span>
      {probablePitchers && (
        <div className="mt-2 space-y-1 text-center">
          <div className="text-[11px] text-muted tracking-wider uppercase">Probable Pitchers</div>
          {probablePitchers.away && (
            <div><span className="text-white/60">{teamAbbr(game.teams?.away)}</span> <span className="text-white/80">{probablePitchers.away.fullName}</span></div>
          )}
          {probablePitchers.home && (
            <div><span className="text-white/60">{teamAbbr(game.teams?.home)}</span> <span className="text-white/80">{probablePitchers.home.fullName}</span></div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Live Situation ───

function SituationSection({ onFirst, onSecond, onThird, balls, strikes, outs, inning, isTopInning, offense, defense, currentPlay, officials, gameInfo, weather }: {
  onFirst: boolean; onSecond: boolean; onThird: boolean;
  balls: number; strikes: number; outs: number;
  inning: number; isTopInning: boolean;
  offense?: any; defense?: any; currentPlay?: any;
  officials?: any[]; gameInfo?: any; weather?: any;
}) {
  return (
    <div className="space-y-3">
      {/* Diamond with all player positions */}
      <div className="flex justify-center">
        <DiamondSVG
          onFirst={onFirst} onSecond={onSecond} onThird={onThird}
          outs={outs} balls={balls} strikes={strikes}
          isTopInning={isTopInning} inning={inning}
          batterName={offense?.batter?.fullName}
          pitcherName={defense?.pitcher?.fullName}
          catcherName={defense?.catcher?.fullName}
          firstRunnerName={offense?.first?.fullName}
          secondRunnerName={offense?.second?.fullName}
          thirdRunnerName={offense?.third?.fullName}
          firstBaseman={defense?.first?.fullName}
          secondBaseman={defense?.second?.fullName}
          shortstop={defense?.shortstop?.fullName}
          thirdBaseman={defense?.third?.fullName}
          leftFielder={defense?.left?.fullName}
          centerFielder={defense?.center?.fullName}
          rightFielder={defense?.right?.fullName}
        />
      </div>

      {/* Due up */}
      {(offense?.onDeck || offense?.inHole) && (
        <div className="bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2">
          <div className="text-xs text-muted tracking-wider uppercase mb-1">Due Up</div>
          <div className="flex gap-3 text-[11px]">
            {offense?.onDeck && <span className="text-white/60">On deck: <span className="text-white/80">{shortName(offense.onDeck.fullName)}</span></span>}
            {offense?.inHole && <span className="text-white/60">In hole: <span className="text-white/80">{shortName(offense.inHole.fullName)}</span></span>}
          </div>
        </div>
      )}

      {/* Fielder names now shown on the diamond graphic above */}

      {/* Last play */}
      {currentPlay?.result?.description && (
        <div className="bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2">
          <div className="text-xs text-muted tracking-wider uppercase mb-0.5">Last Play</div>
          <div className="text-[11px] text-white/70">{currentPlay.result.description}</div>
        </div>
      )}

      {/* Umpires */}
      {officials && officials.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted">
          {officials.map((o: any, i: number) => (
            <span key={i}><span className="text-white/30">{o.officialType}:</span> {o.official?.fullName}</span>
          ))}
        </div>
      )}

      {/* Game info row */}
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted">
        {gameInfo?.attendance != null && <span>Att: {gameInfo.attendance.toLocaleString()}</span>}
      </div>
    </div>
  );
}

// ─── Combined Summary (Linescore + Scoring) ───

function SummarySection({ ls, scoringPlays, awayAbbr, homeAbbr, officials, gameInfo, decisions, weather, probablePitchers, awayTeamEntry, homeTeamEntry }: {
  ls: any; scoringPlays: any[];
  awayAbbr: string; homeAbbr: string;
  officials?: any[]; gameInfo?: any; decisions?: any; weather?: any;
  probablePitchers?: any; awayTeamEntry?: any; homeTeamEntry?: any;
}) {
  const innings: any[] = ls?.innings ?? [];
  const awayTotals = ls?.teams?.away;
  const homeTotals = ls?.teams?.home;

  return (
    <div className="space-y-4">
      {/* Linescore table */}
      {innings.length > 0 && (
        <div>
          <div className="text-[11px] text-muted tracking-wider uppercase mb-2">Linescore</div>
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full text-[11px]" role="table">
              <thead>
                <tr className="text-muted">
                  <th className="text-left font-medium pb-1 pr-2 sticky left-0 bg-[#0a0a0a]">Team</th>
                  {innings.map((inn: any) => (
                    <th key={inn.num} className="text-center font-medium pb-1 px-1 tabular-nums min-w-[18px]">{inn.num}</th>
                  ))}
                  <th className="text-center font-medium pb-1 px-1.5 border-l border-[#1a1a1a]">R</th>
                  <th className="text-center font-medium pb-1 px-1.5">H</th>
                  <th className="text-center font-medium pb-1 px-1.5">E</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-white/70">
                  <td className="font-bold pr-2 py-1 sticky left-0 bg-[#0a0a0a]">{awayAbbr}</td>
                  {innings.map((inn: any) => <td key={inn.num} className="text-center px-1 tabular-nums">{inn.away?.runs ?? "-"}</td>)}
                  <td className="text-center px-1.5 font-bold tabular-nums border-l border-[#1a1a1a]">{awayTotals?.runs ?? "-"}</td>
                  <td className="text-center px-1.5 tabular-nums">{awayTotals?.hits ?? "-"}</td>
                  <td className="text-center px-1.5 tabular-nums">{awayTotals?.errors ?? "-"}</td>
                </tr>
                <tr className="text-white/70">
                  <td className="font-bold pr-2 py-1 sticky left-0 bg-[#0a0a0a]">{homeAbbr}</td>
                  {innings.map((inn: any) => <td key={inn.num} className="text-center px-1 tabular-nums">{inn.home?.runs ?? "-"}</td>)}
                  <td className="text-center px-1.5 font-bold tabular-nums border-l border-[#1a1a1a]">{homeTotals?.runs ?? "-"}</td>
                  <td className="text-center px-1.5 tabular-nums">{homeTotals?.hits ?? "-"}</td>
                  <td className="text-center px-1.5 tabular-nums">{homeTotals?.errors ?? "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pitching decisions with explanations */}
      {decisions && (
        <div className="bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2">
          <div className="text-xs text-muted tracking-wider uppercase mb-1">Pitching Decisions</div>
          <div className="space-y-1 text-[11px]">
            {decisions.winner && (
              <div className="flex items-baseline justify-between">
                <span><span className="text-white/80 font-semibold">{decisions.winner.fullName}</span></span>
                <span className="text-white/50" title="Pitcher credited with the win">Win</span>
              </div>
            )}
            {decisions.loser && (
              <div className="flex items-baseline justify-between">
                <span><span className="text-white/80 font-semibold">{decisions.loser.fullName}</span></span>
                <span className="text-white/50" title="Pitcher charged with the loss">Loss</span>
              </div>
            )}
            {decisions.save && (
              <div className="flex items-baseline justify-between">
                <span><span className="text-white/80 font-semibold">{decisions.save.fullName}</span></span>
                <span className="text-white/50" title="Reliever who finished preserving a lead of 3 runs or fewer">Save</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Starting pitchers */}
      {probablePitchers && (
        <div className="flex gap-4 text-[11px] text-muted">
          {probablePitchers.away && <span><span className="text-white/30">{teamAbbr(awayTeamEntry)} SP:</span> <span className="text-white/60">{probablePitchers.away.fullName}</span></span>}
          {probablePitchers.home && <span><span className="text-white/30">{teamAbbr(homeTeamEntry)} SP:</span> <span className="text-white/60">{probablePitchers.home.fullName}</span></span>}
        </div>
      )}

      {/* Scoring plays */}
      {scoringPlays.length > 0 && (
        <div>
          <div className="text-[11px] text-muted tracking-wider uppercase mb-1.5">Scoring Plays</div>
          <div className="space-y-1.5">
            {scoringPlays.map((p: any, i: number) => {
              const r = p.result;
              const a = p.about;
              return (
                <div key={i} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-white font-bold">●</span>
                      <span className="text-white font-semibold">{r.event}</span>
                    </div>
                    <span className="text-muted tabular-nums text-[11px]">{a.halfInning === "top" ? "▲" : "▼"} {a.inning}</span>
                  </div>
                  <div className="text-[11px] text-white/60 mt-0.5">{r.description}</div>
                  <div className="text-[11px] text-muted mt-0.5 tabular-nums">
                    {awayAbbr} {r.awayScore} - {r.homeScore} {homeAbbr}
                    {r.rbi > 0 && <span className="ml-2">({r.rbi} RBI)</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {scoringPlays.length === 0 && (
        <div className="text-xs text-muted text-center py-2">No runs scored</div>
      )}

      {/* Umpires */}
      {officials && officials.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted">
          {officials.map((o: any, i: number) => (
            <span key={i}><span className="text-white/30">{o.officialType}:</span> {o.official?.fullName}</span>
          ))}
        </div>
      )}

      {/* Game info */}
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted">
        {gameInfo?.attendance != null && <span>Attendance: {gameInfo.attendance.toLocaleString()}</span>}
        {gameInfo?.gameDurationMinutes != null && <span>Duration: {Math.floor(gameInfo.gameDurationMinutes / 60)}:{(gameInfo.gameDurationMinutes % 60).toString().padStart(2, "0")}</span>}
      </div>
    </div>
  );
}

// ─── Stats ───

function StatsSection({ awayAbbr, homeAbbr, boxAway, boxHome, statsTeam, setStatsTeam }: {
  awayAbbr: string; homeAbbr: string;
  boxAway?: any; boxHome?: any;
  statsTeam: "away" | "home" | null;
  setStatsTeam: (t: "away" | "home" | null) => void;
}) {
  if (!boxAway || !boxHome) return <div className="text-xs text-muted text-center py-4">No stats available</div>;

  const team = statsTeam === "away" ? boxAway : statsTeam === "home" ? boxHome : null;
  const abbr = statsTeam === "away" ? awayAbbr : homeAbbr;

  return (
    <div>
      <div className="flex gap-1 mb-3" role="radiogroup">
        {([["away", awayAbbr], ["home", homeAbbr]] as const).map(([side, code]) => (
          <button key={side} role="radio" aria-checked={statsTeam === side}
            onClick={() => setStatsTeam(statsTeam === side ? null : side)}
            className={`flex-1 py-1.5 rounded-md text-xs font-bold tracking-wider transition-colors ${statsTeam === side ? "bg-white text-black" : "bg-white/5 text-muted hover:text-white border border-white/10"}`}>
            {code}
          </button>
        ))}
      </div>

      {!team ? (
        <div className="text-xs text-muted text-center py-4">Select a team to view stats</div>
      ) : (
        <div className="space-y-3">
          {/* Team batting totals */}
          <div>
            <div className="text-[11px] text-muted tracking-wider uppercase mb-1">{abbr} Team Batting</div>
            <div className="grid grid-cols-4 gap-1.5 text-[11px] mb-2">
              <StatBox label="AVG" value={team.teamStats?.batting?.avg ?? "-"} />
              <StatBox label="OBP" value={team.teamStats?.batting?.obp ?? "-"} />
              <StatBox label="SLG" value={team.teamStats?.batting?.slg ?? "-"} />
              <StatBox label="OPS" value={team.teamStats?.batting?.ops ?? "-"} />
            </div>
          </div>

          {/* Batters */}
          <div>
            <div className="text-[11px] text-muted tracking-wider uppercase mb-1">{abbr} Batting</div>
            <div className="overflow-x-auto hide-scrollbar">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-muted text-left">
                    <th className="font-medium pr-1 pb-1">#</th>
                    <th className="font-medium pr-1 pb-1">Name</th>
                    <th className="font-medium pr-1 pb-1">Pos</th>
                    <th className="font-medium pr-1 pb-1 text-right">AB</th>
                    <th className="font-medium pr-1 pb-1 text-right">R</th>
                    <th className="font-medium pr-1 pb-1 text-right">H</th>
                    <th className="font-medium pr-1 pb-1 text-right">2B</th>
                    <th className="font-medium pr-1 pb-1 text-right">3B</th>
                    <th className="font-medium pr-1 pb-1 text-right">HR</th>
                    <th className="font-medium pr-1 pb-1 text-right">RBI</th>
                    <th className="font-medium pr-1 pb-1 text-right">BB</th>
                    <th className="font-medium pr-1 pb-1 text-right">K</th>
                    <th className="font-medium pb-1 text-right">SB</th>
                  </tr>
                </thead>
                <tbody>
                  {(team.batters ?? []).map((id: number) => {
                    const p = team.players?.[`ID${id}`];
                    if (!p) return null;
                    const b = p.stats?.batting ?? {};
                    const hasHits = (b.hits ?? 0) > 0;
                    return (
                      <tr key={id} className={hasHits ? "text-white" : "text-white/50"}>
                        <td className="pr-1 py-0.5 tabular-nums">{p.jerseyNumber}</td>
                        <td className="pr-1 py-0.5 whitespace-nowrap">{p.person?.boxscoreName ?? shortName(p.person?.fullName ?? "")}</td>
                        <td className="pr-1 py-0.5 text-muted">{p.position?.abbreviation}</td>
                        <td className="pr-1 py-0.5 text-right tabular-nums">{b.atBats ?? 0}</td>
                        <td className="pr-1 py-0.5 text-right tabular-nums">{b.runs ?? 0}</td>
                        <td className="pr-1 py-0.5 text-right tabular-nums">{b.hits ?? 0}</td>
                        <td className="pr-1 py-0.5 text-right tabular-nums">{b.doubles ?? 0}</td>
                        <td className="pr-1 py-0.5 text-right tabular-nums">{b.triples ?? 0}</td>
                        <td className="pr-1 py-0.5 text-right tabular-nums">{b.homeRuns ?? 0}</td>
                        <td className="pr-1 py-0.5 text-right tabular-nums">{b.rbi ?? 0}</td>
                        <td className="pr-1 py-0.5 text-right tabular-nums">{b.baseOnBalls ?? 0}</td>
                        <td className="pr-1 py-0.5 text-right tabular-nums">{b.strikeOuts ?? 0}</td>
                        <td className="py-0.5 text-right tabular-nums">{b.stolenBases ?? 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pitchers */}
          <div>
            <div className="text-[11px] text-muted tracking-wider uppercase mb-1">{abbr} Pitching</div>
            <div className="overflow-x-auto hide-scrollbar">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-muted text-left">
                    <th className="font-medium pr-1 pb-1">#</th>
                    <th className="font-medium pr-1 pb-1">Name</th>
                    <th className="font-medium pr-1 pb-1 text-right">IP</th>
                    <th className="font-medium pr-1 pb-1 text-right">H</th>
                    <th className="font-medium pr-1 pb-1 text-right">R</th>
                    <th className="font-medium pr-1 pb-1 text-right">ER</th>
                    <th className="font-medium pr-1 pb-1 text-right">BB</th>
                    <th className="font-medium pr-1 pb-1 text-right">K</th>
                    <th className="font-medium pr-1 pb-1 text-right">HR</th>
                    <th className="font-medium pr-1 pb-1 text-right">NP</th>
                    <th className="font-medium pb-1 text-right">STR</th>
                  </tr>
                </thead>
                <tbody>
                  {(team.pitchers ?? []).map((id: number) => {
                    const p = team.players?.[`ID${id}`];
                    if (!p) return null;
                    const pit = p.stats?.pitching ?? {};
                    return (
                      <tr key={id} className="text-white/70">
                        <td className="pr-1 py-0.5 tabular-nums">{p.jerseyNumber}</td>
                        <td className="pr-1 py-0.5 whitespace-nowrap">{p.person?.boxscoreName ?? shortName(p.person?.fullName ?? "")}</td>
                        <td className="pr-1 py-0.5 text-right tabular-nums">{pit.inningsPitched ?? "-"}</td>
                        <td className="pr-1 py-0.5 text-right tabular-nums">{pit.hits ?? 0}</td>
                        <td className="pr-1 py-0.5 text-right tabular-nums">{pit.runs ?? 0}</td>
                        <td className="pr-1 py-0.5 text-right tabular-nums">{pit.earnedRuns ?? 0}</td>
                        <td className="pr-1 py-0.5 text-right tabular-nums">{pit.baseOnBalls ?? 0}</td>
                        <td className="pr-1 py-0.5 text-right tabular-nums">{pit.strikeOuts ?? 0}</td>
                        <td className="pr-1 py-0.5 text-right tabular-nums">{pit.homeRuns ?? 0}</td>
                        <td className="pr-1 py-0.5 text-right tabular-nums">{pit.pitchesThrown ?? "-"}</td>
                        <td className="py-0.5 text-right tabular-nums">{pit.strikes ?? "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
