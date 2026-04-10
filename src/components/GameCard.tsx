"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  NHLGame,
  NHLTeam,
  PlayByPlayResponse,
  BoxscoreResponse,
  LandingResponse,
  GamePlay,
  SkaterStats,
  GoalieStats,
  PlayersByPosition,
  ScoringPeriod,
  ScoringGoal,
  PenaltyPeriod,
  PenaltyEvent,
  ThreeStar,
  TvBroadcast,
  EVENT_TYPES,
} from "@/lib/types";
import Image from "next/image";
import RinkSVG from "./RinkSVG";

// ─── Helpers ───

function formatTime(utc: string): string {
  return new Date(utc).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function getPeriodLabel(num: number, type: string): string {
  if (type === "OT") return "OT";
  if (type === "SO") return "SO";
  return num === 1 ? "1st" : num === 2 ? "2nd" : num === 3 ? "3rd" : `${num}th`;
}

function isLive(state: string) { return state === "LIVE" || state === "CRIT"; }
function isFinished(state: string) { return state === "OFF" || state === "FINAL"; }
function lastName(full: string) { const p = full.split(" "); return p.length > 1 ? p.slice(1).join(" ") : full; }

function getPlayIcon(tc: number): string {
  switch (tc) {
    case EVENT_TYPES.GOAL: return "●";
    case EVENT_TYPES.SHOT: return "◦";
    case EVENT_TYPES.HIT: return "×";
    case EVENT_TYPES.PENALTY: return "!";
    case EVENT_TYPES.BLOCKED_SHOT: return "▪";
    case EVENT_TYPES.TAKEAWAY: return "↑";
    case EVENT_TYPES.GIVEAWAY: return "↓";
    default: return "·";
  }
}

function getPlayLabel(play: GamePlay): string {
  switch (play.typeDescKey) {
    case "goal": return `GOAL${play.details?.shotType ? ` (${play.details.shotType})` : ""}`;
    case "shot-on-goal": return `Shot${play.details?.shotType ? ` (${play.details.shotType})` : ""}`;
    case "hit": return "Hit";
    case "penalty": return `Penalty${play.details?.reason ? `: ${play.details.reason.replace(/-/g, " ")}` : ""}${play.details?.duration ? ` ${play.details.duration}min` : ""}`;
    case "blocked-shot": return "Blocked shot";
    case "takeaway": return "Takeaway";
    case "giveaway": return "Giveaway";
    case "missed-shot": return "Missed shot";
    case "stoppage": return `Stop${play.details?.reason ? `: ${play.details.reason.replace(/-/g, " ")}` : ""}`;
    default: return play.typeDescKey?.replace(/-/g, " ") ?? "Event";
  }
}

function getSituationLabel(code: string): string | null {
  if (!code || code.length < 4) return null;
  const ag = code[0] === "1", as_ = parseInt(code[1]), hs = parseInt(code[2]), hg = code[3] === "1";
  if (as_ === hs && ag && hg) return null;
  if (!ag || !hg) return `${!ag ? "Away" : "Home"} net empty`;
  if (as_ > hs) return `${as_}v${hs} PP`;
  if (hs > as_) return `${hs}v${as_} PP`;
  return null;
}

// ─── Main Component ───

export default function GameCard({ game }: { game: NHLGame }) {
  const [playData, setPlayData] = useState<PlayByPlayResponse | null>(null);
  const [boxscore, setBoxscore] = useState<BoxscoreResponse | null>(null);
  const [landing, setLanding] = useState<LandingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsTeam, setStatsTeam] = useState<"away" | "home" | null>(null);
  const [activeSection, setActiveSection] = useState<"stats" | "plays" | "scoring" | "penalties">("scoring");

  const live = isLive(game.gameState);
  const finished = isFinished(game.gameState);
  const started = live || finished;

  const gameIdRef = useRef(game.id);
  useEffect(() => { gameIdRef.current = game.id; }, [game.id]);

  const loadData = useCallback(async () => {
    if (!started) return;
    const id = gameIdRef.current;
    // Only show loading on very first fetch
    setLoading((prev) => prev && true);
    try {
      const [pbpRes, boxRes, landRes] = await Promise.all([
        fetch(`/api/game?id=${id}`),
        fetch(`/api/boxscore?id=${id}`),
        fetch(`/api/landing?id=${id}`),
      ]);
      if (pbpRes.ok) setPlayData(await pbpRes.json());
      if (boxRes.ok) setBoxscore(await boxRes.json());
      if (landRes.ok) setLanding(await landRes.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [started]);

  // Fast poll for puck position (1s), slower for full data (15s)
  const loadPuck = useCallback(async () => {
    if (!live) return;
    try {
      const res = await fetch(`/api/game?id=${gameIdRef.current}`);
      if (res.ok) setPlayData(await res.json());
    } catch { /* silent */ }
  }, [live]);

  useEffect(() => {
    loadData();
    if (!live) return;
    const ivFull = setInterval(loadData, 15000);
    const ivPuck = setInterval(loadPuck, 1000);
    return () => { clearInterval(ivFull); clearInterval(ivPuck); };
  }, [loadData, loadPuck, live]);

  const away = playData?.awayTeam ?? game.awayTeam ?? {} as NHLTeam;
  const home = playData?.homeTeam ?? game.homeTeam ?? {} as NHLTeam;
  const clock = playData?.clock ?? game.clock;
  const period = playData?.periodDescriptor ?? game.periodDescriptor;
  const plays = playData?.plays ?? [];
  const currentState = playData?.gameState ?? game.gameState;

  const significantPlays = plays
    .filter((p) => ([EVENT_TYPES.GOAL, EVENT_TYPES.SHOT, EVENT_TYPES.PENALTY, EVENT_TYPES.HIT, EVENT_TYPES.BLOCKED_SHOT, EVENT_TYPES.TAKEAWAY, EVENT_TYPES.GIVEAWAY] as number[]).includes(p.typeCode))
    .reverse();

  const lastPlayWithCoords = live
    ? [...plays].reverse().find((p) => p.details?.xCoord !== undefined)
    : undefined;

  const latestSituation = plays.length > 0 ? plays[plays.length - 1].situationCode : null;

  const awayPlayers = boxscore?.playerByGameStats?.awayTeam;
  const homePlayers = boxscore?.playerByGameStats?.homeTeam;
  const summary = landing?.summary;
  const broadcasts = landing?.tvBroadcasts ?? [];
  const threeStars = summary?.threeStars;

  // Possession: determined by which team owns the last event
  const lastPlay = plays.length > 0 ? plays[plays.length - 1] : null;
  const possessionTeamId = lastPlay?.details?.eventOwnerTeamId;
  const awayHasPuck = possessionTeamId === away?.id;
  const homeHasPuck = possessionTeamId === home?.id;

  // Full team names for tooltips
  const awayFullName = away?.placeName?.default && away?.commonName?.default
    ? `${away.placeName.default} ${away.commonName.default}` : away?.abbrev ?? "Away";
  const homeFullName = home?.placeName?.default && home?.commonName?.default
    ? `${home.placeName.default} ${home.commonName.default}` : home?.abbrev ?? "Home";

  return (
    <div
      className="flex-shrink-0 w-[480px] h-full flex flex-col bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden"
      role="article"
      aria-label={`${away?.abbrev ?? "Away"} vs ${home?.abbrev ?? "Home"} game card`}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        {/* Status row */}
        <div className="flex items-center justify-between mb-2" role="status">
          {live ? (
            <div className="flex items-center gap-1.5">
              <span className="live-pulse inline-block w-1.5 h-1.5 rounded-full bg-white" aria-hidden="true" />
              <span className="text-xs text-white font-semibold tracking-wider uppercase">
                Live{period ? ` · ${getPeriodLabel(period.number, period.periodType)}` : ""}
              </span>
            </div>
          ) : finished ? (
            <span className="text-xs text-muted font-medium tracking-wider uppercase">
              Final{game.gameOutcome?.lastPeriodType && game.gameOutcome.lastPeriodType !== "REG" ? ` / ${game.gameOutcome.lastPeriodType}` : ""}
            </span>
          ) : (
            <span className="text-xs text-muted font-medium tracking-wider">
              {formatTime(game.startTimeUTC)}
            </span>
          )}
          {clock && isLive(currentState) && (
            <span className="text-xs text-muted tabular-nums" aria-label={`Time remaining: ${clock.inIntermission ? "Intermission" : clock.timeRemaining}`}>
              {clock.inIntermission ? "INT" : clock.timeRemaining}
            </span>
          )}
        </div>

        {/* Score: Logo ABB 2 - 4 ABB Logo */}
        <div className="flex items-center justify-center gap-3 py-1" aria-label={started ? `${away?.abbrev} ${away?.score ?? 0}, ${home?.abbrev} ${home?.score ?? 0}` : `${away?.abbrev} versus ${home?.abbrev}`}>
          <div className="flex items-center gap-2">
            {away?.darkLogo && (
              <Image src={away.darkLogo} alt={away?.abbrev ?? ""} width={28} height={28} className="w-7 h-7" unoptimized />
            )}
            <span className={`text-sm font-bold cursor-default ${finished && (away?.score ?? 0) > (home?.score ?? 0) ? "text-white" : started ? "text-muted" : "text-white"}`} title={awayFullName}>
              {away?.abbrev}
            </span>
          </div>
          {started ? (
            <>
              <span className={`text-xl font-bold tabular-nums ${finished && (away?.score ?? 0) > (home?.score ?? 0) ? "text-white" : "text-muted"}`}>{away?.score ?? 0}</span>
              <span className="text-muted text-sm" aria-hidden="true">-</span>
              <span className={`text-xl font-bold tabular-nums ${finished && (home?.score ?? 0) > (away?.score ?? 0) ? "text-white" : "text-muted"}`}>{home?.score ?? 0}</span>
            </>
          ) : (
            <span className="text-muted text-xs">vs</span>
          )}
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold cursor-default ${finished && (home?.score ?? 0) > (away?.score ?? 0) ? "text-white" : started ? "text-muted" : "text-white"}`} title={homeFullName}>
              {home?.abbrev}
            </span>
            {home?.darkLogo && (
              <Image src={home.darkLogo} alt={home?.abbrev ?? ""} width={28} height={28} className="w-7 h-7" unoptimized />
            )}
          </div>
        </div>

        {/* Possession indicator */}
        {live && possessionTeamId && (
          <div className="flex items-center justify-center gap-2 mt-0.5 text-[11px]">
            <span className={awayHasPuck ? "text-white font-semibold" : "text-muted"}>{away?.abbrev}</span>
            <div className="relative w-20 h-1 bg-[#1a1a1a] rounded-full">
              <div className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full transition-all duration-500 ${awayHasPuck ? "left-0" : homeHasPuck ? "right-0" : "left-1/2 -translate-x-1/2"}`} />
            </div>
            <span className={homeHasPuck ? "text-white font-semibold" : "text-muted"}>{home?.abbrev}</span>
          </div>
        )}

        {/* SOG & Situation */}
        {started && (
          <div className="mt-2 flex items-center justify-between text-xs text-muted">
            <span aria-label={`Shots on goal: ${away.abbrev} ${away.sog ?? 0}, ${home.abbrev} ${home.sog ?? 0}`}>
              SOG {away.sog ?? 0} - {home.sog ?? 0}
            </span>
            {latestSituation && getSituationLabel(latestSituation) && (
              <span className="text-white font-semibold">{getSituationLabel(latestSituation)}</span>
            )}
          </div>
        )}

        {/* Venue & Broadcast */}
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted">
          <span>{game.venue?.default ?? ""}</span>
          {broadcasts.length > 0 && (
            <span aria-label={`Broadcast: ${broadcasts.map(b => b.network).join(", ")}`}>
              {broadcasts.map(b => b.network).filter((v, i, a) => a.indexOf(v) === i).join(", ")}
            </span>
          )}
        </div>
      </div>

      {/* Three Stars */}
      {threeStars && threeStars.length > 0 && (
        <div className="px-5 pb-2">
          <ThreeStarsRow stars={threeStars} />
        </div>
      )}

      {/* Rink - only for live games */}
      {live && lastPlayWithCoords && (
        <div className="px-4 pb-2" aria-label="Ice rink with current puck position">
          <RinkSVG puckX={lastPlayWithCoords.details?.xCoord} puckY={lastPlayWithCoords.details?.yCoord} />
        </div>
      )}

      <div className="mx-5 border-t border-[#1a1a1a]" />

      {/* Section tabs */}
      {started && (
        <div className="px-5 pt-2 pb-1 flex gap-1" role="tablist" aria-label="Game sections">
          {(["scoring", "penalties", "stats", "plays"] as const).map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={activeSection === s}
              onClick={() => setActiveSection(s)}
              className={`px-2.5 py-1 rounded-md text-[11px] tracking-wider uppercase transition-colors ${
                activeSection === s ? "bg-white text-black font-bold" : "text-muted hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Scrollable content */}
      <div className="card-scroll-area flex-1 overflow-y-auto hide-scrollbar px-5 py-3" role="tabpanel">
        {!started ? (
          <PreGameInfo game={game} broadcasts={broadcasts} />
        ) : loading && plays.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted text-xs" role="status">Loading...</div>
        ) : (
          <>
            {activeSection === "scoring" && (
              <ScoringSection scoring={summary?.scoring} awayAbbrev={away.abbrev} homeAbbrev={home.abbrev} />
            )}
            {activeSection === "penalties" && (
              <PenaltiesSection penalties={summary?.penalties} />
            )}
            {activeSection === "stats" && (
              <StatsSection
                awayAbbrev={away.abbrev}
                homeAbbrev={home.abbrev}
                awayPlayers={awayPlayers}
                homePlayers={homePlayers}
                statsTeam={statsTeam}
                setStatsTeam={setStatsTeam}
              />
            )}
            {activeSection === "plays" && (
              <PlaysSection plays={significantPlays} awayAbbrev={away.abbrev} homeAbbrev={home.abbrev} awayId={away.id} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Pre-game ───

function PreGameInfo({ game, broadcasts }: { game: NHLGame; broadcasts: TvBroadcast[] }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted text-xs gap-2">
      <span>Game starts at</span>
      <span className="font-semibold text-white text-sm">{formatTime(game.startTimeUTC)}</span>
      <span className="mt-1">{game.venue?.default ?? ""}</span>
      {broadcasts.length > 0 && (
        <span>Watch on {broadcasts.map(b => b.network).filter((v, i, a) => a.indexOf(v) === i).join(", ")}</span>
      )}
    </div>
  );
}

// ─── Three Stars ───

function ThreeStarsRow({ stars }: { stars: ThreeStar[] }) {
  return (
    <div aria-label="Three stars of the game">
      <div className="text-xs text-muted tracking-wider uppercase text-center mb-1.5">
        Three Stars of the Game
      </div>
      <div className="flex gap-2 justify-center">
        {stars.sort((a, b) => a.star - b.star).map((s) => {
          const ordinal = s.star === 1 ? "1st" : s.star === 2 ? "2nd" : "3rd";
          return (
            <div key={s.star} className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-center min-w-[100px]">
              <div className="text-xs text-muted uppercase tracking-wider mb-0.5">{ordinal} Star</div>
              <div className="text-xs text-white font-semibold">{lastName(s.name.default)}</div>
              <div className="text-[11px] text-muted">{s.teamAbbrev} · {s.position}</div>
              <div className="text-[11px] text-white/70 mt-0.5">
                {s.position === "G" ? (
                  s.savePctg ? `${(s.savePctg * 100).toFixed(1)}% SV` : ""
                ) : (
                  `${s.goals ?? 0}G ${s.assists ?? 0}A`
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Scoring Section ───

function ScoringSection({ scoring, awayAbbrev, homeAbbrev }: { scoring?: ScoringPeriod[]; awayAbbrev: string; homeAbbrev: string }) {
  if (!scoring || scoring.length === 0) {
    return <EmptyState text="No scoring data" />;
  }
  return (
    <div className="space-y-3">
      {scoring.map((period) => (
        <div key={period.periodDescriptor.number}>
          <div className="text-[11px] text-muted tracking-wider uppercase mb-1.5">
            {getPeriodLabel(period.periodDescriptor.number, period.periodDescriptor.periodType)} Period
            {period.goals.length === 0 && <span className="ml-2 italic">No goals</span>}
          </div>
          <div className="space-y-1.5">
            {period.goals.map((goal) => (
              <GoalRow key={goal.playerId + goal.timeInPeriod} goal={goal} awayAbbrev={awayAbbrev} homeAbbrev={homeAbbrev} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function GoalRow({ goal, awayAbbrev, homeAbbrev }: { goal: ScoringGoal; awayAbbrev: string; homeAbbrev: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-white font-bold">●</span>
          <span className="text-white font-semibold">{goal.name.default}</span>
          <span className="text-muted">({goal.goalsToDate})</span>
          <span className="text-muted font-medium">{goal.teamAbbrev.default}</span>
        </div>
        <span className="text-muted tabular-nums">{goal.timeInPeriod}</span>
      </div>
      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted">
        {goal.strength !== "ev" && (
          <span className="text-white/70 font-semibold uppercase">{goal.strength}</span>
        )}
        {goal.goalModifier && goal.goalModifier !== "none" && (
          <span className="text-white/70">{goal.goalModifier.replace(/-/g, " ")}</span>
        )}
        {goal.shotType && <span>{goal.shotType}</span>}
        <span className="ml-auto tabular-nums">{awayAbbrev} {goal.awayScore} - {goal.homeScore} {homeAbbrev}</span>
      </div>
      {goal.assists.length > 0 && (
        <div className="mt-1 text-[11px] text-muted">
          Assists: {goal.assists.map((a, i) => (
            <span key={a.playerId}>
              {i > 0 && ", "}
              <span className="text-white/60">{a.name.default}</span>
              <span className="text-muted"> ({a.assistsToDate})</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Penalties Section ───

function PenaltiesSection({ penalties }: { penalties?: PenaltyPeriod[] }) {
  if (!penalties || penalties.length === 0) {
    return <EmptyState text="No penalty data" />;
  }
  const totalPens = penalties.reduce((sum, p) => sum + p.penalties.length, 0);
  if (totalPens === 0) {
    return <EmptyState text="No penalties" />;
  }
  return (
    <div className="space-y-3">
      {penalties.map((period) => (
        <div key={period.periodDescriptor.number}>
          <div className="text-[11px] text-muted tracking-wider uppercase mb-1.5">
            {getPeriodLabel(period.periodDescriptor.number, period.periodDescriptor.periodType)} Period
            <span className="ml-2 text-muted">({period.penalties.length})</span>
          </div>
          {period.penalties.length === 0 ? (
            <div className="text-[11px] text-muted italic pl-2">None</div>
          ) : (
            <div className="space-y-1">
              {period.penalties.map((pen, i) => (
                <PenaltyRow key={`${pen.timeInPeriod}-${i}`} penalty={pen} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function str(v: { default: string } | string | undefined): string {
  if (!v) return "";
  return typeof v === "string" ? v : v.default;
}

function PenaltyRow({ penalty: p }: { penalty: PenaltyEvent }) {
  return (
    <div className="flex items-start gap-2 py-1 px-2 rounded-lg text-xs bg-white/[0.02] border border-white/5">
      <span className="text-muted flex-shrink-0">!</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-white/70 font-medium">
            {p.descKey.replace(/-/g, " ")}
            <span className="text-muted ml-1">{p.duration}min</span>
          </span>
          <span className="text-muted tabular-nums text-[11px]">{p.timeInPeriod}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5">
          <span className="font-semibold text-white/40">{p.teamAbbrev.default}</span>
          {p.committedByPlayer && (
            <span>#{p.committedByPlayer.sweaterNumber} {str(p.committedByPlayer.lastName)}</span>
          )}
          {p.drawnBy && (
            <span className="ml-auto">Drawn by #{p.drawnBy.sweaterNumber} {str(p.drawnBy.lastName)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stats Section (with team toggle) ───

function StatsSection({
  awayAbbrev, homeAbbrev, awayPlayers, homePlayers, statsTeam, setStatsTeam,
}: {
  awayAbbrev: string;
  homeAbbrev: string;
  awayPlayers?: PlayersByPosition;
  homePlayers?: PlayersByPosition;
  statsTeam: "away" | "home" | null;
  setStatsTeam: (t: "away" | "home" | null) => void;
}) {
  if (!awayPlayers || !homePlayers) {
    return <EmptyState text="No player stats" />;
  }

  return (
    <div>
      {/* Team toggle */}
      <div className="flex gap-1 mb-3" role="radiogroup" aria-label="Select team stats">
        <ToggleButton
          active={statsTeam === "away"}
          onClick={() => setStatsTeam(statsTeam === "away" ? null : "away")}
          label={awayAbbrev}
        />
        <ToggleButton
          active={statsTeam === "home"}
          onClick={() => setStatsTeam(statsTeam === "home" ? null : "home")}
          label={homeAbbrev}
        />
      </div>

      {statsTeam === null ? (
        <div className="text-xs text-muted text-center py-4">
          Select a team above to view player stats
        </div>
      ) : (
        <TeamStats
          abbrev={statsTeam === "away" ? awayAbbrev : homeAbbrev}
          players={statsTeam === "away" ? awayPlayers : homePlayers}
        />
      )}
    </div>
  );
}

function ToggleButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`flex-1 py-1.5 rounded-md text-xs font-bold tracking-wider transition-colors ${
        active ? "bg-white text-black" : "bg-white/5 text-muted hover:text-white border border-white/10"
      }`}
    >
      {label}
    </button>
  );
}

function TeamStats({ abbrev, players }: { abbrev: string; players: PlayersByPosition }) {
  const skaters = [...players.forwards, ...players.defense];
  const goalies = players.goalies;

  return (
    <div className="space-y-3">
      {/* Skaters */}
      <div>
        <div className="text-[11px] text-muted tracking-wider uppercase mb-1">{abbrev} Skaters</div>
        <div className="overflow-x-auto hide-scrollbar" role="table" aria-label={`${abbrev} skater statistics`}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-muted text-left">
                <th className="font-medium pr-1.5 pb-1">#</th>
                <th className="font-medium pr-1.5 pb-1">Name</th>
                <th className="font-medium pr-1.5 pb-1">Pos</th>
                <th className="font-medium pr-1.5 pb-1 text-right">G</th>
                <th className="font-medium pr-1.5 pb-1 text-right">A</th>
                <th className="font-medium pr-1.5 pb-1 text-right">P</th>
                <th className="font-medium pr-1.5 pb-1 text-right">+/-</th>
                <th className="font-medium pr-1.5 pb-1 text-right">PIM</th>
                <th className="font-medium pr-1.5 pb-1 text-right">SOG</th>
                <th className="font-medium pr-1.5 pb-1 text-right">HIT</th>
                <th className="font-medium pr-1.5 pb-1 text-right">BLK</th>
                <th className="font-medium pr-1.5 pb-1 text-right">GV</th>
                <th className="font-medium pr-1.5 pb-1 text-right">TK</th>
                <th className="font-medium pr-1.5 pb-1 text-right">FO%</th>
                <th className="font-medium pr-1.5 pb-1 text-right">SHF</th>
                <th className="font-medium pb-1 text-right">TOI</th>
              </tr>
            </thead>
            <tbody>
              {skaters.map((p) => <SkaterRow key={p.playerId} player={p} />)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Goalies */}
      {goalies.length > 0 && (
        <div>
          <div className="text-[11px] text-muted tracking-wider uppercase mb-1">{abbrev} Goalies</div>
          <table className="w-full text-[11px]" role="table" aria-label={`${abbrev} goalie statistics`}>
            <thead>
              <tr className="text-muted text-left">
                <th className="font-medium pr-1.5 pb-1">#</th>
                <th className="font-medium pr-1.5 pb-1">Name</th>
                <th className="font-medium pr-1.5 pb-1 text-right">DEC</th>
                <th className="font-medium pr-1.5 pb-1 text-right">SV</th>
                <th className="font-medium pr-1.5 pb-1 text-right">SV%</th>
                <th className="font-medium pr-1.5 pb-1 text-right">GA</th>
                <th className="font-medium pr-1.5 pb-1 text-right">ES</th>
                <th className="font-medium pr-1.5 pb-1 text-right">PP</th>
                <th className="font-medium pr-1.5 pb-1 text-right">SH</th>
                <th className="font-medium pr-1.5 pb-1 text-right">PIM</th>
                <th className="font-medium pb-1 text-right">TOI</th>
              </tr>
            </thead>
            <tbody>
              {goalies.map((g) => <GoalieRow key={g.playerId} goalie={g} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SkaterRow({ player: p }: { player: SkaterStats }) {
  const hasPoints = p.goals > 0 || p.assists > 0;
  return (
    <tr className={hasPoints ? "text-white" : "text-white/50"}>
      <td className="pr-1.5 py-0.5 tabular-nums">{p.sweaterNumber}</td>
      <td className="pr-1.5 py-0.5 whitespace-nowrap">{lastName(p.name.default)}</td>
      <td className="pr-1.5 py-0.5 text-muted">{p.position}</td>
      <td className="pr-1.5 py-0.5 text-right tabular-nums">{p.goals}</td>
      <td className="pr-1.5 py-0.5 text-right tabular-nums">{p.assists}</td>
      <td className="pr-1.5 py-0.5 text-right tabular-nums">{p.points}</td>
      <td className="pr-1.5 py-0.5 text-right tabular-nums">{p.plusMinus > 0 ? `+${p.plusMinus}` : p.plusMinus}</td>
      <td className="pr-1.5 py-0.5 text-right tabular-nums">{p.pim}</td>
      <td className="pr-1.5 py-0.5 text-right tabular-nums">{p.sog}</td>
      <td className="pr-1.5 py-0.5 text-right tabular-nums">{p.hits}</td>
      <td className="pr-1.5 py-0.5 text-right tabular-nums">{p.blockedShots}</td>
      <td className="pr-1.5 py-0.5 text-right tabular-nums">{p.giveaways}</td>
      <td className="pr-1.5 py-0.5 text-right tabular-nums">{p.takeaways}</td>
      <td className="pr-1.5 py-0.5 text-right tabular-nums">{p.faceoffWinningPctg > 0 ? `${(p.faceoffWinningPctg * 100).toFixed(0)}` : "-"}</td>
      <td className="pr-1.5 py-0.5 text-right tabular-nums">{p.shifts}</td>
      <td className="py-0.5 text-right tabular-nums">{p.toi}</td>
    </tr>
  );
}

function GoalieRow({ goalie: g }: { goalie: GoalieStats }) {
  return (
    <tr className="text-white/70">
      <td className="pr-1.5 py-0.5 tabular-nums">{g.sweaterNumber}</td>
      <td className="pr-1.5 py-0.5 whitespace-nowrap">{lastName(g.name.default)}</td>
      <td className="pr-1.5 py-0.5 text-right">{g.decision ?? "-"}</td>
      <td className="pr-1.5 py-0.5 text-right tabular-nums">{g.saveShotsAgainst}</td>
      <td className="pr-1.5 py-0.5 text-right tabular-nums">{g.savePctg > 0 ? (g.savePctg * 100).toFixed(1) : "-"}</td>
      <td className="pr-1.5 py-0.5 text-right tabular-nums">{g.goalsAgainst}</td>
      <td className="pr-1.5 py-0.5 text-right tabular-nums">{g.evenStrengthShotsAgainst}</td>
      <td className="pr-1.5 py-0.5 text-right tabular-nums">{g.powerPlayShotsAgainst}</td>
      <td className="pr-1.5 py-0.5 text-right tabular-nums">{g.shorthandedShotsAgainst}</td>
      <td className="pr-1.5 py-0.5 text-right tabular-nums">{g.pim}</td>
      <td className="py-0.5 text-right tabular-nums">{g.toi}</td>
    </tr>
  );
}

// ─── Plays Section ───

function PlaysSection({ plays, awayAbbrev, homeAbbrev, awayId }: { plays: GamePlay[]; awayAbbrev: string; homeAbbrev: string; awayId: number }) {
  if (plays.length === 0) return <EmptyState text="No plays yet" />;
  return (
    <div className="space-y-1">
      {plays.map((play) => (
        <PlayRow key={play.eventId} play={play} awayAbbrev={awayAbbrev} homeAbbrev={homeAbbrev} awayId={awayId} />
      ))}
    </div>
  );
}

function PlayRow({ play, awayAbbrev, homeAbbrev, awayId }: { play: GamePlay; awayAbbrev: string; homeAbbrev: string; awayId: number }) {
  const isGoal = play.typeCode === EVENT_TYPES.GOAL;
  const isPenalty = play.typeCode === EVENT_TYPES.PENALTY;
  const teamAbbrev = play.details?.eventOwnerTeamId === awayId ? awayAbbrev : homeAbbrev;

  return (
    <div className={`flex items-start gap-2 py-1.5 px-2 rounded-lg text-xs ${isGoal ? "bg-white/5 border border-white/10" : isPenalty ? "bg-white/[0.02] border border-white/5" : ""}`}>
      <span className={`flex-shrink-0 w-3 text-center ${isGoal ? "text-white font-bold" : "text-muted"}`} aria-hidden="true">{getPlayIcon(play.typeCode)}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <span className={`font-medium ${isGoal ? "text-white" : "text-white/70"}`}>{getPlayLabel(play)}</span>
          <span className="text-muted flex-shrink-0 tabular-nums text-[11px]">{play.timeInPeriod} P{play.periodDescriptor.number}</span>
        </div>
        <div className="flex items-center gap-2 text-muted mt-0.5">
          {play.details?.eventOwnerTeamId && <span className="font-semibold text-white/40">{teamAbbrev}</span>}
          {play.details?.zoneCode && <span>{play.details.zoneCode === "O" ? "off" : play.details.zoneCode === "D" ? "def" : "nz"}</span>}
        </div>
        {isGoal && play.details?.awayScore !== undefined && (
          <div className="text-white font-semibold mt-0.5">{awayAbbrev} {play.details.awayScore} - {play.details.homeScore} {homeAbbrev}</div>
        )}
      </div>
    </div>
  );
}

// ─── Shared ───

function EmptyState({ text }: { text: string }) {
  return <div className="flex items-center justify-center h-full text-muted text-xs py-8">{text}</div>;
}
