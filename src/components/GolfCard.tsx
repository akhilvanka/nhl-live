"use client";

import { useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Types ───

interface HoleScore {
  hole: number;
  strokes: number;
  displayValue: string;
  toPar: string;
}

interface Competitor {
  id: string;
  name: string;
  shortName: string;
  country: string;
  score: string;
  today: string | null;
  thru: number | null;
  holeScores: HoleScore[];
  linescores: { round: number; value?: number | null; displayValue?: string | null }[];
}

interface GolfEvent {
  id: string;
  name: string;
  shortName: string;
  date: string;
  endDate: string;
  status: {
    state: string;
    detail: string;
    shortDetail: string;
    completed: boolean;
    period: number;
  };
  broadcast: string;
  competitors: Competitor[];
  venue: string;
  course: string;
}

// ─── Helpers ───

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function scoreColor(score: string): string {
  if (!score || score === "E") return "text-white/60";
  const n = parseInt(score);
  if (isNaN(n)) return "text-white/60";
  if (n < 0) return "text-red-400";
  return "text-blue-400";
}

function holeScoreColor(toPar: string): string {
  if (!toPar || toPar === "E") return "text-white/50";
  const n = parseInt(toPar);
  if (isNaN(n)) return "text-white/50";
  if (n <= -2) return "text-yellow-400"; // eagle or better
  if (n === -1) return "text-red-400"; // birdie
  if (n === 1) return "text-blue-400"; // bogey
  return "text-blue-500"; // double+
}

function holeScoreBg(toPar: string): string {
  if (!toPar || toPar === "E") return "";
  const n = parseInt(toPar);
  if (isNaN(n)) return "";
  if (n <= -2) return "bg-yellow-400/15 rounded";
  if (n === -1) return "bg-red-400/10 rounded";
  if (n === 1) return "bg-blue-400/10 rounded";
  if (n >= 2) return "bg-blue-500/15 rounded";
  return "";
}

function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null && "name" in v) return String((v as Record<string, unknown>).name);
  return String(v);
}

// Compute leaderboard positions with ties
function computePositions(players: Competitor[]): string[] {
  const positions: string[] = [];
  for (let i = 0; i < players.length; i++) {
    if (i > 0 && players[i].score === players[i - 1].score) {
      // Tie — use same position as previous
      const prev = positions[i - 1];
      positions.push(prev.startsWith("T") ? prev : "T" + prev);
      // Retroactively mark previous as tied too
      if (!positions[i - 1].startsWith("T")) {
        positions[i - 1] = "T" + positions[i - 1];
      }
    } else {
      positions.push(String(i + 1));
    }
  }
  return positions;
}

// ─── Augusta National Hole Data ───

type HoleShape = "straight" | "slight-r" | "slight-l" | "dog-r" | "dog-l";

interface HoleDef {
  num: number;
  name: string;
  par: number;
  yards: number;
  shape: HoleShape;
  bunkerPositions?: [number, number][];
  water?: "front" | "left" | "surround";
}

const AUGUSTA: HoleDef[] = [
  { num: 1, name: "Tea Olive", par: 4, yards: 445, shape: "slight-r", bunkerPositions: [[40, 16]] },
  { num: 2, name: "Pink Dogwood", par: 5, yards: 575, shape: "dog-l", bunkerPositions: [[18, 14], [28, 12]] },
  { num: 3, name: "Flowering Peach", par: 4, yards: 350, shape: "straight", bunkerPositions: [[16, 18], [34, 16]] },
  { num: 4, name: "Flowering Crab Apple", par: 3, yards: 240, shape: "straight", bunkerPositions: [[14, 34], [36, 36]] },
  { num: 5, name: "Magnolia", par: 4, yards: 495, shape: "dog-l", bunkerPositions: [[12, 45], [20, 16]] },
  { num: 6, name: "Juniper", par: 3, yards: 180, shape: "straight", bunkerPositions: [[36, 38]] },
  { num: 7, name: "Pampas", par: 4, yards: 450, shape: "slight-l", bunkerPositions: [[18, 16], [30, 18]] },
  { num: 8, name: "Yellow Jasmine", par: 5, yards: 570, shape: "slight-r", bunkerPositions: [[34, 14], [38, 45]] },
  { num: 9, name: "Carolina Cherry", par: 4, yards: 460, shape: "straight", bunkerPositions: [[16, 16], [34, 18]] },
  { num: 10, name: "Camellia", par: 4, yards: 495, shape: "dog-l", bunkerPositions: [[20, 15]] },
  { num: 11, name: "White Dogwood", par: 4, yards: 520, shape: "dog-l", bunkerPositions: [[18, 14]], water: "left" },
  { num: 12, name: "Golden Bell", par: 3, yards: 155, shape: "straight", bunkerPositions: [[14, 32], [36, 34]], water: "front" },
  { num: 13, name: "Azalea", par: 5, yards: 510, shape: "dog-l", bunkerPositions: [[16, 12], [26, 14]], water: "front" },
  { num: 14, name: "Chinese Fir", par: 4, yards: 440, shape: "dog-r", bunkerPositions: [[32, 16]] },
  { num: 15, name: "Firethorn", par: 5, yards: 530, shape: "slight-l", bunkerPositions: [[16, 16], [32, 12]], water: "front" },
  { num: 16, name: "Redbud", par: 3, yards: 170, shape: "straight", bunkerPositions: [[36, 34]], water: "surround" },
  { num: 17, name: "Nandina", par: 4, yards: 440, shape: "slight-l", bunkerPositions: [[16, 18]] },
  { num: 18, name: "Holly", par: 4, yards: 465, shape: "dog-r", bunkerPositions: [[20, 45], [36, 16]] },
];

// Generic holes for non-Augusta courses
const GENERIC_SHAPES: HoleShape[] = [
  "straight", "slight-r", "dog-l", "straight", "dog-r", "slight-l",
  "straight", "slight-r", "straight", "dog-l", "slight-r", "straight",
  "dog-r", "straight", "dog-l", "straight", "slight-l", "dog-r",
];
const GENERIC_PARS = [4, 4, 5, 3, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4];

function getHoles(eventName: string): HoleDef[] {
  const name = eventName.toLowerCase();
  if (name.includes("masters") || name.includes("augusta")) return AUGUSTA;
  return GENERIC_PARS.map((par, i) => ({
    num: i + 1,
    name: `Hole ${i + 1}`,
    par,
    yards: par === 3 ? 175 : par === 5 ? 540 : 435,
    shape: GENERIC_SHAPES[i],
    bunkerPositions: [[par === 3 ? 34 : 32, par === 3 ? 36 : 16]] as [number, number][],
  }));
}

// ─── Fairway SVG Generation ───
// ViewBox: 50×90, green at top, tee at bottom

function fairwayPath(par: number, shape: HoleShape): string {
  if (par === 3) {
    return "M21,78 Q20,62 19,48 Q25,34 31,48 Q30,62 29,78 Z";
  }
  const w = par === 5 ? 2 : 0;
  switch (shape) {
    case "straight":
      return `M${19 - w},85 Q${18 - w},55 ${19 - w},20 Q25,${10 - w} ${31 + w},20 Q${32 + w},55 ${31 + w},85 Z`;
    case "slight-r":
      return `M${17 - w},85 Q${18 - w},65 ${21},42 Q${27},22 ${35 + w},14 Q${33 + w},8 ${27},14 Q${22},24 ${29 + w},48 Q${31 + w},68 ${29 + w},85 Z`;
    case "slight-l":
      return `M${21 + w},85 Q${19 + w},68 ${21},48 Q${28},24 ${23},14 Q${17 - w},8 ${15 - w},14 Q${23},22 ${29},42 Q${32 + w},65 ${33 + w},85 Z`;
    case "dog-r":
      return `M${15 - w},85 Q${16 - w},65 ${19},46 Q${25},30 ${35 + w},16 Q${33 + w},8 ${27},12 Q${21},24 ${21 - w},42 Q${20 - w},62 ${21 - w},85 Z`;
    case "dog-l":
      return `M${35 + w},85 Q${34 + w},65 ${31},46 Q${25},30 ${15 - w},16 Q${17 - w},8 ${23},12 Q${29},24 ${29 + w},42 Q${30 + w},62 ${29 + w},85 Z`;
  }
}

function greenCenter(par: number, shape: HoleShape): [number, number] {
  if (par === 3) return [25, 40];
  switch (shape) {
    case "straight": return [25, 16];
    case "slight-r": return [31, 12];
    case "slight-l": return [19, 12];
    case "dog-r": return [31, 12];
    case "dog-l": return [19, 12];
  }
}

function teeCenter(par: number, shape: HoleShape): [number, number] {
  if (par === 3) return [25, 80];
  switch (shape) {
    case "straight": return [25, 87];
    case "slight-r": return [22, 87];
    case "slight-l": return [28, 87];
    case "dog-r": return [18, 87];
    case "dog-l": return [32, 87];
  }
}

// ─── Hole SVG Component ───

function HoleSVG({ hole }: { hole: HoleDef }) {
  const fp = fairwayPath(hole.par, hole.shape);
  const [gx, gy] = greenCenter(hole.par, hole.shape);
  const [tx, ty] = teeCenter(hole.par, hole.shape);

  const parColor = hole.par === 3 ? "#f87171" : hole.par === 5 ? "#4ade80" : "#888";

  return (
    <svg viewBox="0 0 50 95" className="w-full h-full">
      {/* Background */}
      <rect x="0" y="0" width="50" height="95" rx="4" fill="#060e06" />

      {/* Rough border (subtle) */}
      <path d={fp} fill="none" stroke="#1a3a1a" strokeWidth="4" opacity="0.3" />

      {/* Fairway */}
      <path d={fp} fill="#0f1f0f" stroke="#1a3a1a" strokeWidth="0.5" />

      {/* Water hazard */}
      {hole.water === "front" && (
        <ellipse cx={gx} cy={gy + (hole.par === 3 ? 10 : 8)} rx={8} ry={2.5} fill="#0a2040" stroke="#1a3a6a" strokeWidth="0.3" />
      )}
      {hole.water === "left" && (
        <ellipse cx={gx - 8} cy={gy + 3} rx={4} ry={5} fill="#0a2040" stroke="#1a3a6a" strokeWidth="0.3" />
      )}
      {hole.water === "surround" && (
        <ellipse cx={gx} cy={gy + 2} rx={12} ry={6} fill="#0a2040" stroke="#1a3a6a" strokeWidth="0.3" />
      )}

      {/* Bunkers */}
      {(hole.bunkerPositions ?? []).map(([bx, by], i) => (
        <ellipse key={i} cx={bx} cy={by} rx={2.5} ry={1.8} fill="#2a2418" stroke="#4a3a20" strokeWidth="0.3" />
      ))}

      {/* Green */}
      <ellipse cx={gx} cy={gy} rx={4.5} ry={3.5} fill="#1a3a1a" stroke="#2a5a2a" strokeWidth="0.4" />
      {/* Flag pin */}
      <line x1={gx} y1={gy - 3.5} x2={gx} y2={gy - 7} stroke="#fff" strokeWidth="0.4" />
      <polygon points={`${gx},${gy - 7} ${gx + 3},${gy - 5.5} ${gx},${gy - 4}`} fill="#f44" />

      {/* Tee box */}
      <rect x={tx - 2.5} y={ty - 1} width="5" height="2" rx="0.5" fill="#2a2a2a" stroke="#444" strokeWidth="0.3" />

      {/* Hole number */}
      <text x="25" y="93" fill={parColor} fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">{hole.num}</text>
    </svg>
  );
}

// ─── Main Component ───

export default function GolfCard({ event }: { event: GolfEvent }) {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "course" | "scorecard">("leaderboard");
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const isLive = event.status?.state === "in";
  const isPost = event.status?.state === "post" || event.status?.completed;
  const started = isLive || isPost;

  const players = event.competitors ?? [];
  const top30 = players.slice(0, 30);
  const status = event.status ?? {} as GolfEvent["status"];
  const currentRound = status.period || 1;

  const eventName = str(event.name);
  const eventVenue = str(event.venue);
  const eventCourse = str(event.course);
  const eventBroadcast = str(event.broadcast);

  const holes = getHoles(eventName);
  const isAugusta = eventName.toLowerCase().includes("masters") || eventName.toLowerCase().includes("augusta");

  const positions = computePositions(players);

  // Find selected player for scorecard
  const scorecardPlayer = players.find((p) => p.id === selectedPlayer) ?? players[0];

  return (
    <div className="flex-shrink-0 w-[540px] h-full flex flex-col bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden" role="article" aria-label={`${eventName} golf card`}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        {/* Status line */}
        <div className="flex items-center justify-between mb-2" role="status">
          {isLive ? (
            <div className="flex items-center gap-1.5">
              <span className="live-pulse inline-block w-1.5 h-1.5 rounded-full bg-white" aria-hidden="true" />
              <span className="text-xs text-white font-semibold tracking-wider uppercase">
                Round {currentRound}
              </span>
            </div>
          ) : isPost ? (
            <span className="text-xs text-muted font-medium tracking-wider uppercase">Final</span>
          ) : (
            <span className="text-xs text-muted font-medium tracking-wider">{status.shortDetail || status.detail || ""}</span>
          )}
          {eventBroadcast && (
            <span className="text-[11px] text-muted">{eventBroadcast}</span>
          )}
        </div>

        {/* Tournament name */}
        <div className="text-sm font-bold text-white">{eventName}</div>
        <div className="text-[11px] text-muted mt-0.5">
          {eventVenue && <span>{eventVenue}</span>}
          {eventCourse && <span> · {eventCourse}</span>}
          <span> · {formatDate(event.date)} – {formatDate(event.endDate)}</span>
        </div>

        {/* Top 3 leader boxes */}
        {started && top30.length >= 3 && (
          <div className="mt-3 flex gap-2">
            {top30.slice(0, 3).map((p, i) => (
              <div key={p.id} className={`flex-1 rounded-lg px-3 py-2 ${i === 0 ? "bg-white/[0.07] border border-white/10" : "bg-white/[0.03]"}`}>
                <div className="text-[10px] text-muted uppercase tracking-wider">{i === 0 ? "Leader" : i === 1 ? "2nd" : "3rd"}</div>
                <div className={`text-xs font-semibold mt-0.5 ${i === 0 ? "text-white" : "text-white/70"}`}>{p.shortName || p.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs font-bold ${scoreColor(p.score)}`}>{p.score === "E" ? "E" : p.score}</span>
                  {p.today && <span className="text-[10px] text-muted">Today: {p.today}</span>}
                  {p.thru && !isPost && <span className="text-[10px] text-muted">Thru {p.thru}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mx-5 border-t border-[#1a1a1a]" />

      {/* Tabs */}
      <div className="px-5 pt-2 pb-1 flex gap-1" role="tablist">
        {(started
          ? (["leaderboard", "course", "scorecard"] as const)
          : (["course"] as const)
        ).map((t) => (
          <button key={t} role="tab" aria-selected={activeTab === t} onClick={() => setActiveTab(t)}
            className={`px-2.5 py-1 rounded-md text-[11px] tracking-wider uppercase transition-colors ${activeTab === t ? "bg-white text-black font-bold" : "text-muted hover:text-white"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="card-scroll-area flex-1 overflow-y-auto hide-scrollbar px-5 py-3" role="tabpanel">
        {activeTab === "leaderboard" && started ? (
          <LeaderboardTab
            players={top30}
            positions={positions}
            currentRound={currentRound}
            isPost={!!isPost}
            onSelectPlayer={(id) => { setSelectedPlayer(id); setActiveTab("scorecard"); }}
          />
        ) : activeTab === "scorecard" && started ? (
          <ScorecardTab
            player={scorecardPlayer}
            players={players.slice(0, 20)}
            holes={holes}
            currentRound={currentRound}
            selectedId={selectedPlayer}
            onSelect={setSelectedPlayer}
          />
        ) : activeTab === "course" ? (
          <CourseTab holes={holes} isAugusta={isAugusta} />
        ) : (
          <PreTournamentInfo event={event} venue={eventVenue} broadcast={eventBroadcast} />
        )}
      </div>
    </div>
  );
}

// ─── Leaderboard Tab ───

function LeaderboardTab({ players, positions, currentRound, isPost, onSelectPlayer }: {
  players: Competitor[];
  positions: string[];
  currentRound: number;
  isPost: boolean;
  onSelectPlayer: (id: string) => void;
}) {
  if (players.length === 0) {
    return <div className="text-xs text-muted text-center py-4">No leaderboard data</div>;
  }

  return (
    <table className="w-full text-[11px]">
      <thead>
        <tr className="text-muted text-left">
          <th className="font-medium pb-1.5 w-8 text-center">Pos</th>
          <th className="font-medium pb-1.5">Player</th>
          <th className="font-medium pb-1.5 text-right w-10">Total</th>
          {!isPost && <th className="font-medium pb-1.5 text-right w-10">Today</th>}
          {!isPost && <th className="font-medium pb-1.5 text-right w-8">Thru</th>}
          {Array.from({ length: Math.min(currentRound, 4) }, (_, i) => (
            <th key={i} className="font-medium pb-1.5 text-right w-8">R{i + 1}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {players.map((p, idx) => {
          const pos = positions[idx];
          return (
            <tr
              key={p.id}
              className={`cursor-pointer transition-colors ${idx === 0 ? "text-white" : idx < 3 ? "text-white/80" : idx < 10 ? "text-white/60" : "text-white/40"} hover:bg-white/[0.03]`}
              onClick={() => onSelectPlayer(p.id)}
              title={`${p.name} — ${p.country}`}
            >
              <td className="py-1 text-center tabular-nums text-muted text-[10px]">{pos}</td>
              <td className="py-1">
                <div className="flex items-center gap-1.5">
                  <span className={idx < 3 ? "font-semibold" : ""}>{p.shortName || p.name}</span>
                  {idx < 5 && p.country && <span className="text-[10px] text-muted">{p.country}</span>}
                </div>
              </td>
              <td className={`py-1 text-right tabular-nums font-bold ${scoreColor(p.score)}`}>{p.score}</td>
              {!isPost && (
                <td className={`py-1 text-right tabular-nums ${scoreColor(p.today ?? "")}`}>
                  {p.today ?? "–"}
                </td>
              )}
              {!isPost && (
                <td className="py-1 text-right tabular-nums text-muted text-[10px]">
                  {p.thru ? (p.thru >= 18 ? "F" : p.thru) : "–"}
                </td>
              )}
              {Array.from({ length: Math.min(currentRound, 4) }, (_, i) => {
                const ls = p.linescores[i];
                return (
                  <td key={i} className="py-1 text-right tabular-nums text-white/40 w-8">
                    {ls?.value != null ? ls.value : "–"}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Scorecard Tab ───

function ScorecardTab({ player, players, holes, currentRound, selectedId, onSelect }: {
  player: Competitor | undefined;
  players: Competitor[];
  holes: HoleDef[];
  currentRound: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (!player) return <div className="text-xs text-muted text-center py-4">No scorecard data</div>;

  const frontNine = holes.slice(0, 9);
  const backNine = holes.slice(9, 18);
  const hs = player.holeScores ?? [];

  const frontScores = hs.filter((h) => h.hole <= 9);
  const backScores = hs.filter((h) => h.hole > 9);

  const frontPar = frontNine.reduce((a, h) => a + h.par, 0);
  const backPar = backNine.reduce((a, h) => a + h.par, 0);
  const frontTotal = frontScores.reduce((a, h) => a + h.strokes, 0);
  const backTotal = backScores.reduce((a, h) => a + h.strokes, 0);

  return (
    <div className="space-y-4">
      {/* Player selector */}
      <div className="flex items-center gap-2">
        <select
          className="bg-[#111] border border-[#222] rounded-md px-2 py-1 text-xs text-white outline-none"
          value={selectedId ?? player.id}
          onChange={(e) => onSelect(e.target.value)}
        >
          {players.map((p, i) => (
            <option key={p.id} value={p.id}>{i + 1}. {p.shortName || p.name} ({p.score})</option>
          ))}
        </select>
        <span className="text-[11px] text-muted">Round {currentRound}</span>
      </div>

      {/* Player score summary */}
      <div className="flex items-center gap-4">
        <div>
          <div className="text-[10px] text-muted uppercase tracking-wider">Total</div>
          <div className={`text-lg font-bold ${scoreColor(player.score)}`}>{player.score}</div>
        </div>
        {player.today && (
          <div>
            <div className="text-[10px] text-muted uppercase tracking-wider">Today</div>
            <div className={`text-lg font-bold ${scoreColor(player.today)}`}>{player.today}</div>
          </div>
        )}
        {player.thru && (
          <div>
            <div className="text-[10px] text-muted uppercase tracking-wider">Thru</div>
            <div className="text-lg font-bold text-white/60">{player.thru >= 18 ? "F" : player.thru}</div>
          </div>
        )}
      </div>

      {/* Front Nine Card */}
      <div>
        <div className="text-[10px] text-muted tracking-wider uppercase mb-1.5">Front Nine</div>
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-muted">
                <th className="font-medium pb-1 pr-1 text-left w-8">Hole</th>
                {frontNine.map((h) => (
                  <th key={h.num} className="font-medium pb-1 text-center w-[28px]">{h.num}</th>
                ))}
                <th className="font-medium pb-1 text-center border-l border-[#1a1a1a] pl-1 w-8">Out</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-white/40">
                <td className="py-0.5 pr-1 font-medium text-muted">Par</td>
                {frontNine.map((h) => (
                  <td key={h.num} className={`py-0.5 text-center tabular-nums ${h.par === 3 ? "text-red-400/50" : h.par === 5 ? "text-green-400/50" : ""}`}>{h.par}</td>
                ))}
                <td className="py-0.5 text-center font-medium border-l border-[#1a1a1a] pl-1 text-muted">{frontPar}</td>
              </tr>
              <tr className="text-white">
                <td className="py-0.5 pr-1 font-medium text-muted">Score</td>
                {frontNine.map((h) => {
                  const hs_ = frontScores.find((s) => s.hole === h.num);
                  return (
                    <td key={h.num} className={`py-0.5 text-center tabular-nums ${hs_ ? `${holeScoreColor(hs_.toPar)} ${holeScoreBg(hs_.toPar)}` : "text-white/20"}`}>
                      {hs_?.strokes ?? "·"}
                    </td>
                  );
                })}
                <td className="py-0.5 text-center font-bold border-l border-[#1a1a1a] pl-1 tabular-nums">{frontTotal || "–"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Back Nine Card */}
      <div>
        <div className="text-[10px] text-muted tracking-wider uppercase mb-1.5">Back Nine</div>
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-muted">
                <th className="font-medium pb-1 pr-1 text-left w-8">Hole</th>
                {backNine.map((h) => (
                  <th key={h.num} className="font-medium pb-1 text-center w-[28px]">{h.num}</th>
                ))}
                <th className="font-medium pb-1 text-center border-l border-[#1a1a1a] pl-1 w-8">In</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-white/40">
                <td className="py-0.5 pr-1 font-medium text-muted">Par</td>
                {backNine.map((h) => (
                  <td key={h.num} className={`py-0.5 text-center tabular-nums ${h.par === 3 ? "text-red-400/50" : h.par === 5 ? "text-green-400/50" : ""}`}>{h.par}</td>
                ))}
                <td className="py-0.5 text-center font-medium border-l border-[#1a1a1a] pl-1 text-muted">{backPar}</td>
              </tr>
              <tr className="text-white">
                <td className="py-0.5 pr-1 font-medium text-muted">Score</td>
                {backNine.map((h) => {
                  const hs_ = backScores.find((s) => s.hole === h.num);
                  return (
                    <td key={h.num} className={`py-0.5 text-center tabular-nums ${hs_ ? `${holeScoreColor(hs_.toPar)} ${holeScoreBg(hs_.toPar)}` : "text-white/20"}`}>
                      {hs_?.strokes ?? "·"}
                    </td>
                  );
                })}
                <td className="py-0.5 text-center font-bold border-l border-[#1a1a1a] pl-1 tabular-nums">{backTotal || "–"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 text-[10px] text-muted pt-1">
        <span><span className="text-yellow-400">Eagle</span></span>
        <span><span className="text-red-400">Birdie</span></span>
        <span>Par</span>
        <span><span className="text-blue-400">Bogey</span></span>
        <span><span className="text-blue-500">Double+</span></span>
      </div>
    </div>
  );
}

// ─── Course Tab ───

function CourseTab({ holes, isAugusta }: { holes: HoleDef[]; isAugusta: boolean }) {
  const totalPar = holes.reduce((a, h) => a + h.par, 0);
  const totalYards = holes.reduce((a, h) => a + h.yards, 0);

  return (
    <div className="space-y-3">
      {/* Course header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-white">
            {isAugusta ? "Augusta National Golf Club" : "Course Layout"}
          </div>
          <div className="text-[10px] text-muted">Par {totalPar} · {totalYards.toLocaleString()} yards · 18 holes</div>
        </div>
        <div className="flex gap-2 text-[10px] text-muted">
          <span><span className="text-red-400">Par 3</span></span>
          <span>Par 4</span>
          <span><span className="text-green-400">Par 5</span></span>
        </div>
      </div>

      {/* Hole grid: 3 columns */}
      <div className="grid grid-cols-3 gap-1.5">
        {holes.map((hole) => (
          <div key={hole.num} className="bg-[#060e06] border border-[#1a1a1a] rounded-lg overflow-hidden">
            {/* Hole SVG */}
            <div className="aspect-[1/1.6] p-0.5">
              <HoleSVG hole={hole} />
            </div>
            {/* Hole info */}
            <div className="px-2 py-1.5 border-t border-[#1a1a1a] bg-[#0a0a0a]">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold ${hole.par === 3 ? "text-red-400" : hole.par === 5 ? "text-green-400" : "text-white/70"}`}>
                  Par {hole.par}
                </span>
                <span className="text-[10px] text-muted tabular-nums">{hole.yards}y</span>
              </div>
              {isAugusta && (
                <div className="text-[9px] text-white/30 mt-0.5 truncate" title={hole.name}>{hole.name}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pre-Tournament Info ───

function PreTournamentInfo({ event, venue, broadcast }: { event: GolfEvent; venue: string; broadcast: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted text-xs gap-3">
      <span className="text-[11px] tracking-wider uppercase">Starts</span>
      <span className="font-semibold text-white text-sm">{formatDate(event.date)}</span>
      {venue && <span>{venue}</span>}
      {broadcast && <span>Watch on {broadcast}</span>}
      {(event.competitors ?? []).length > 0 && (
        <div className="mt-3 w-full">
          <div className="text-[11px] text-muted tracking-wider uppercase mb-2 text-center">Field ({(event.competitors ?? []).length} players)</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
            {(event.competitors ?? []).slice(0, 20).map((c) => (
              <div key={c.id} className="flex items-center gap-1.5">
                <span className="text-white/60">{c.shortName || c.name}</span>
                <span className="text-[10px] text-muted">{c.country}</span>
              </div>
            ))}
          </div>
          {(event.competitors ?? []).length > 20 && (
            <div className="text-xs text-muted text-center mt-1">+{(event.competitors ?? []).length - 20} more</div>
          )}
        </div>
      )}
    </div>
  );
}
