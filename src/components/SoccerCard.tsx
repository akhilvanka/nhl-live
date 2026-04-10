"use client";

import { useEffect, useState, useCallback, useRef } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

function str(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object" && "name" in (val as any)) return String((val as any).name ?? "");
  return "";
}

interface SoccerMatchCardProps {
  event: any;
  league: string;
}

export default function SoccerCard({ event, league }: SoccerMatchCardProps) {
  if (!event || typeof event !== "object" || !event.competitions) {
    return null;
  }
  const comp = event.competitions?.[0];
  const eventId = event.id;
  const [summary, setSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "stats" | "events" | "h2h">("summary");
  const isRefresh = useRef(false);

  const home = comp?.competitors?.find((c: any) => c.homeAway === "home") ?? comp?.competitors?.[0];
  const away = comp?.competitors?.find((c: any) => c.homeAway === "away") ?? comp?.competitors?.[1];

  const status = comp?.status?.type;
  const state = status?.state ?? "pre";
  const isLive = state === "in";
  const isPost = state === "post";
  const isPre = state === "pre";
  const clock = comp?.status?.displayClock ?? "";
  const statusText = str(status?.shortDetail) || str(status?.description);

  const homeName = str(home?.team?.abbreviation) || str(home?.team?.shortDisplayName);
  const awayName = str(away?.team?.abbreviation) || str(away?.team?.shortDisplayName);
  const homeFullName = str(home?.team?.displayName) || str(home?.team?.name);
  const awayFullName = str(away?.team?.displayName) || str(away?.team?.name);
  const homeScore = str(home?.score);
  const awayScore = str(away?.score);
  const homeColor = home?.team?.color ? `#${home.team.color}` : "#666";
  const awayColor = away?.team?.color ? `#${away.team.color}` : "#666";
  const homeForm = str(home?.form);
  const awayForm = str(away?.form);
  const homeRecord = home?.records?.[0]?.summary ?? "";
  const awayRecord = away?.records?.[0]?.summary ?? "";
  const venue = str(comp?.venue?.fullName);

  // Match details (goals, cards)
  const details = comp?.details ?? [];
  const goals = details.filter((d: any) => d.scoringPlay);
  const cards = details.filter((d: any) => d.yellowCard || d.redCard);

  // Statistics from competitors
  const homeStats = home?.statistics ?? [];
  const awayStats = away?.statistics ?? [];

  // Leaders
  const homeLeader = home?.leaders?.[0]?.leaders?.[0] ?? null;
  const awayLeader = away?.leaders?.[0]?.leaders?.[0] ?? null;

  // Load match summary for h2h
  const loadSummary = useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await fetch(`/api/soccer/match?id=${eventId}&league=${league}`);
      if (res.ok) setSummary(await res.json());
    } catch { /* silent */ }
  }, [eventId, league]);

  // Load summary when h2h tab is selected
  useEffect(() => {
    if (activeTab === "h2h" && !summary) loadSummary();
  }, [activeTab, summary, loadSummary]);

  // Auto-refresh live
  useEffect(() => {
    if (!isLive) return;
    // Parent handles refresh via re-render with new event prop
  }, [isLive]);

  return (
    <div className="flex-shrink-0 w-96 h-full flex flex-col bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden" role="article" aria-label={`${homeFullName} vs ${awayFullName}`}>
      {/* Header - Score */}
      <div className={`px-4 pt-3 pb-2 ${isLive ? "bg-white/[0.02]" : ""}`}>
        {/* Status */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs tracking-wider uppercase font-bold ${isLive ? "text-green-400" : isPost ? "text-white/40" : "text-muted"}`}>
            {isLive ? `⦿ ${clock}` : statusText}
          </span>
          {venue && <span className="text-[11px] text-muted truncate max-w-[140px]">{venue}</span>}
        </div>

        {/* Scoreboard */}
        <div className="space-y-1.5">
          {/* Home */}
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: homeColor }} />
            <span className="text-xs font-bold text-white flex-1" title={homeFullName}>{homeName}</span>
            <span className="text-xs text-muted tabular-nums mr-2">{homeRecord}</span>
            <span className={`text-lg font-bold tabular-nums ${(isPost || isLive) ? (home?.winner ? "text-white" : "text-white/60") : "text-muted/30"}`}>
              {(isPost || isLive) ? homeScore : ""}
            </span>
          </div>
          {/* Away */}
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: awayColor }} />
            <span className="text-xs font-bold text-white flex-1" title={awayFullName}>{awayName}</span>
            <span className="text-xs text-muted tabular-nums mr-2">{awayRecord}</span>
            <span className={`text-lg font-bold tabular-nums ${(isPost || isLive) ? (away?.winner ? "text-white" : "text-white/60") : "text-muted/30"}`}>
              {(isPost || isLive) ? awayScore : ""}
            </span>
          </div>
        </div>

        {/* Form guide */}
        {(homeForm || awayForm) && (
          <div className="mt-2 flex justify-between items-center">
            <FormDisplay form={homeForm} />
            <span className="text-[11px] text-muted">FORM</span>
            <FormDisplay form={awayForm} />
          </div>
        )}

        {/* Possession bar (live/post) */}
        {(isLive || isPost) && homeStats.length > 0 && (
          <PossessionBar homeStats={homeStats} awayStats={awayStats} homeColor={homeColor} awayColor={awayColor} />
        )}
      </div>

      <div className="mx-4 border-t border-[#1a1a1a]" />

      {/* Tabs */}
      <div className="px-4 pt-2 pb-1 flex gap-1" role="tablist">
        {(["summary", "stats", "events", "h2h"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={activeTab === t} onClick={() => setActiveTab(t)}
            className={`px-2 py-1 rounded-md text-[11px] tracking-wider uppercase transition-colors ${activeTab === t ? "bg-white text-black font-bold" : "text-muted hover:text-white"}`}>
            {t === "h2h" ? "H2H" : t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="card-scroll-area flex-1 overflow-y-auto hide-scrollbar px-4 py-2" role="tabpanel">
        {activeTab === "summary" && (
          <SummarySection
            goals={goals} cards={cards} details={details}
            homeTeamId={home?.team?.id} awayTeamId={away?.team?.id}
            homeName={homeName} awayName={awayName}
            homeColor={homeColor} awayColor={awayColor}
            homeLeader={homeLeader} awayLeader={awayLeader}
            isPre={isPre} isPost={isPost} isLive={isLive}
            event={event}
          />
        )}
        {activeTab === "stats" && (
          <StatsSection homeStats={homeStats} awayStats={awayStats} homeName={homeName} awayName={awayName} homeColor={homeColor} awayColor={awayColor} />
        )}
        {activeTab === "events" && (
          <EventsSection details={details} homeTeamId={home?.team?.id} homeColor={homeColor} awayColor={awayColor} />
        )}
        {activeTab === "h2h" && (
          <H2HSection summary={summary} homeName={homeName} awayName={awayName} />
        )}
      </div>
    </div>
  );
}

// ─── Form display ───
function FormDisplay({ form }: { form: string }) {
  return (
    <div className="flex gap-0.5">
      {form.split("").map((c: string, i: number) => (
        <span key={i} className={`w-4 h-4 rounded-sm flex items-center justify-center text-[11px] font-bold ${
          c === "W" ? "bg-green-500/20 text-green-400" :
          c === "L" ? "bg-red-500/20 text-red-400" :
          "bg-yellow-500/10 text-yellow-500/70"
        }`}>{c}</span>
      ))}
    </div>
  );
}

// ─── Possession bar ───
function PossessionBar({ homeStats, awayStats, homeColor, awayColor }: { homeStats: any[]; awayStats: any[]; homeColor: string; awayColor: string }) {
  const homePoss = homeStats.find((s: any) => s.name === "possessionPct");
  const awayPoss = awayStats.find((s: any) => s.name === "possessionPct");
  if (!homePoss && !awayPoss) return null;

  const hVal = parseFloat(homePoss?.displayValue ?? "50");
  const aVal = parseFloat(awayPoss?.displayValue ?? "50");

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs mb-0.5">
        <span style={{ color: homeColor }}>{hVal}%</span>
        <span className="text-muted text-[11px]">POSSESSION</span>
        <span style={{ color: awayColor }}>{aVal}%</span>
      </div>
      <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden flex">
        <div className="h-full rounded-l-full transition-all" style={{ width: `${hVal}%`, backgroundColor: homeColor }} />
        <div className="h-full rounded-r-full transition-all" style={{ width: `${aVal}%`, backgroundColor: awayColor }} />
      </div>
    </div>
  );
}

// ─── Summary ───
function SummarySection({ goals, cards, details, homeTeamId, awayTeamId, homeName, awayName, homeColor, awayColor, homeLeader, awayLeader, isPre, isPost, isLive, event }: any) {
  const broadcast = event.competitions?.[0]?.broadcasts?.[0]?.names?.[0] ?? "";

  return (
    <div className="space-y-3">
      {/* Goals */}
      {goals.length > 0 && (
        <div>
          <div className="text-xs text-muted tracking-wider uppercase mb-1">Goals</div>
          {goals.map((g: any, i: number) => {
            const isHome = g.team?.id === homeTeamId;
            const scorer = g.athletesInvolved?.[0]?.displayName ?? "Goal";
            const minute = g.clock?.displayValue ?? "";
            const pen = g.penaltyKick ? " (pen)" : "";
            const og = g.ownGoal ? " (og)" : "";
            return (
              <div key={i} className={`flex items-center gap-1.5 text-[11px] py-0.5 ${isHome ? "" : "flex-row-reverse text-right"}`}>
                <span className="text-white/50">⚽</span>
                <span className="text-white/80">{scorer}{pen}{og}</span>
                <span className="text-muted text-xs">{minute}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Cards */}
      {cards.length > 0 && (
        <div>
          <div className="text-xs text-muted tracking-wider uppercase mb-1">Cards</div>
          {cards.map((c: any, i: number) => {
            const isHome = c.team?.id === homeTeamId;
            const player = c.athletesInvolved?.[0]?.displayName ?? "";
            const minute = c.clock?.displayValue ?? "";
            const isRed = c.redCard;
            return (
              <div key={i} className={`flex items-center gap-1.5 text-xs py-0.5 ${isHome ? "" : "flex-row-reverse text-right"}`}>
                <span className={`w-2 h-2.5 rounded-[1px] ${isRed ? "bg-red-500" : "bg-yellow-400"}`} />
                <span className="text-white/60">{player}</span>
                <span className="text-muted text-[11px]">{minute}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Top scorers / leaders */}
      {(homeLeader || awayLeader) && (
        <div>
          <div className="text-xs text-muted tracking-wider uppercase mb-1">Top Scorers</div>
          <div className="space-y-1">
            {homeLeader && (
              <div className="flex items-center gap-2 text-[11px]">
                <div className="w-1 h-3 rounded-full" style={{ backgroundColor: homeColor }} />
                <span className="text-white/70">{str(homeLeader.athlete?.displayName)}</span>
                <span className="text-muted text-xs ml-auto">{homeLeader.displayValue ?? str(homeLeader.value)} goals</span>
              </div>
            )}
            {awayLeader && (
              <div className="flex items-center gap-2 text-[11px]">
                <div className="w-1 h-3 rounded-full" style={{ backgroundColor: awayColor }} />
                <span className="text-white/70">{str(awayLeader.athlete?.displayName)}</span>
                <span className="text-muted text-xs ml-auto">{awayLeader.displayValue ?? str(awayLeader.value)} goals</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pre-match info */}
      {isPre && (
        <div className="space-y-2">
          {broadcast && (
            <div className="text-[11px]">
              <span className="text-muted text-xs tracking-wider uppercase">Broadcast: </span>
              <span className="text-white/60">{broadcast}</span>
            </div>
          )}
          <div className="text-xs text-muted text-center py-2">Match has not started</div>
        </div>
      )}

      {/* No events for completed match with no details */}
      {(isPost || isLive) && goals.length === 0 && cards.length === 0 && (
        <div className="text-xs text-muted text-center py-2">
          {isPost ? "No goals scored" : "No events yet"}
        </div>
      )}
    </div>
  );
}

// ─── Stats ───
function StatsSection({ homeStats, awayStats, homeName, awayName, homeColor, awayColor }: any) {
  if (homeStats.length === 0 && awayStats.length === 0) {
    return <div className="text-xs text-muted text-center py-4">No match stats available yet</div>;
  }

  // Pair stats by name
  const statNames = [
    "possessionPct", "totalShots", "shotsOnTarget", "wonCorners",
    "foulsCommitted", "goalAssists", "totalGoals",
  ];
  const statLabels: Record<string, string> = {
    possessionPct: "Possession %",
    totalShots: "Total Shots",
    shotsOnTarget: "Shots on Target",
    wonCorners: "Corners",
    foulsCommitted: "Fouls",
    goalAssists: "Assists",
    totalGoals: "Goals",
  };

  // Include any stats from the data that we haven't listed
  const allStatNames = new Set([
    ...homeStats.map((s: any) => s.name),
    ...awayStats.map((s: any) => s.name),
  ]);
  const orderedNames = [...statNames.filter(n => allStatNames.has(n)), ...[...allStatNames].filter(n => !statNames.includes(n))];

  return (
    <div>
      <div className="flex justify-between text-xs text-muted tracking-wider uppercase mb-2">
        <span style={{ color: homeColor }}>{homeName}</span>
        <span style={{ color: awayColor }}>{awayName}</span>
      </div>
      <div className="space-y-1.5">
        {orderedNames.map((name) => {
          const hStat = homeStats.find((s: any) => s.name === name);
          const aStat = awayStats.find((s: any) => s.name === name);
          const hVal = parseFloat(hStat?.displayValue ?? "0");
          const aVal = parseFloat(aStat?.displayValue ?? "0");
          const total = hVal + aVal || 1;
          const hPct = (hVal / total) * 100;
          const label = statLabels[name] ?? name.replace(/([A-Z])/g, " $1").replace(/^./, (s: string) => s.toUpperCase());

          return (
            <div key={name}>
              <div className="flex justify-between items-center text-[11px] mb-0.5">
                <span className="tabular-nums text-white/70">{hStat?.displayValue ?? "0"}</span>
                <span className="text-[11px] text-muted uppercase">{label}</span>
                <span className="tabular-nums text-white/70">{aStat?.displayValue ?? "0"}</span>
              </div>
              <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden flex">
                <div className="h-full rounded-l-full" style={{ width: `${hPct}%`, backgroundColor: homeColor, opacity: 0.7 }} />
                <div className="h-full rounded-r-full" style={{ width: `${100 - hPct}%`, backgroundColor: awayColor, opacity: 0.7 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Match Events Timeline ───
function EventsSection({ details, homeTeamId, homeColor, awayColor }: any) {
  if (!details || details.length === 0) {
    return <div className="text-xs text-muted text-center py-4">No match events</div>;
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#1a1a1a]" />

      <div className="space-y-1">
        {details.map((d: any, i: number) => {
          const isHome = d.team?.id === homeTeamId;
          const player = d.athletesInvolved?.[0]?.displayName ?? "";
          const minute = d.clock?.displayValue ?? "";
          const isGoal = d.scoringPlay;
          const isYellow = d.yellowCard;
          const isRed = d.redCard;
          const isPen = d.penaltyKick;
          const isOG = d.ownGoal;

          let icon = "";
          let iconColor = "";
          if (isGoal) { icon = "⚽"; iconColor = ""; }
          else if (isRed) { icon = "🟥"; iconColor = ""; }
          else if (isYellow) { icon = "🟨"; iconColor = ""; }
          else { icon = "⟳"; iconColor = "text-muted"; }

          const color = isHome ? homeColor : awayColor;

          return (
            <div key={i} className={`flex items-center gap-1 text-xs ${isHome ? "flex-row pr-[52%]" : "flex-row-reverse pl-[52%]"}`}>
              <span className="text-white/40 tabular-nums w-6 text-center flex-shrink-0">{minute}</span>
              <span className={`flex-shrink-0 ${iconColor}`}>{icon}</span>
              <span className="text-white/60 truncate" style={{ color: isGoal ? color : undefined }}>
                {player}
                {isPen ? " (pen)" : ""}{isOG ? " (og)" : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Head to Head ───
function H2HSection({ summary, homeName, awayName }: any) {
  if (!summary) {
    return <div className="text-xs text-muted text-center py-4">Loading head-to-head...</div>;
  }

  const h2hGames = summary.headToHeadGames ?? [];
  const boxForm = summary.boxscore?.form ?? [];

  return (
    <div className="space-y-3">
      {/* Recent meetings */}
      {h2hGames.length > 0 && (
        <div>
          <div className="text-xs text-muted tracking-wider uppercase mb-1">Recent Meetings</div>
          <div className="space-y-1">
            {h2hGames.slice(0, 8).map((g: any) => {
              const gDate = g.gameDate ? new Date(g.gameDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "";
              const homeTeam = g.competitors?.find((c: any) => c.homeAway === "home");
              const awayTeam = g.competitors?.find((c: any) => c.homeAway === "away");
              return (
                <div key={g.id} className="flex items-center gap-1 text-xs">
                  <span className="text-muted tabular-nums w-14">{gDate}</span>
                  <span className={`flex-1 text-right ${homeTeam?.winner ? "text-white font-semibold" : "text-white/50"}`}>
                    {str(homeTeam?.team?.abbreviation)}
                  </span>
                  <span className="text-white/80 tabular-nums px-1 font-bold">
                    {homeTeam?.score} - {awayTeam?.score}
                  </span>
                  <span className={`flex-1 ${awayTeam?.winner ? "text-white font-semibold" : "text-white/50"}`}>
                    {str(awayTeam?.team?.abbreviation)}
                  </span>
                  <span className="text-muted text-[11px] w-16 text-right truncate">{str(g.competitionName) || str(g.leagueName)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Team form (recent results) */}
      {boxForm.length > 0 && (
        <div>
          <div className="text-xs text-muted tracking-wider uppercase mb-1">Recent Form</div>
          {boxForm.map((tf: any, ti: number) => (
            <div key={ti} className="mb-2">
              <div className="text-[11px] text-white/70 mb-1">{str(tf.team?.displayName)}</div>
              <div className="space-y-0.5">
                {(tf.events ?? []).slice(0, 5).map((e: any, ei: number) => {
                  const result = e.gameResult;
                  const resultColor = result === "W" ? "text-green-400" : result === "L" ? "text-red-400" : "text-yellow-500/70";
                  return (
                    <div key={ei} className="flex items-center gap-2 text-xs">
                      <span className={`w-3 font-bold ${resultColor}`}>{result}</span>
                      <span className="text-white/50 tabular-nums">{e.score ?? ""}</span>
                      <span className="text-muted text-[11px] truncate">{str(e.opponent?.displayName)}</span>
                      <span className="text-muted text-[11px] ml-auto">{str(e.leagueName)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {h2hGames.length === 0 && boxForm.length === 0 && (
        <div className="text-xs text-muted text-center py-4">No head-to-head data available</div>
      )}
    </div>
  );
}
