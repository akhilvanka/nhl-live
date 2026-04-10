"use client";

interface DiamondSVGProps {
  onFirst: boolean;
  onSecond: boolean;
  onThird: boolean;
  outs: number;
  balls: number;
  strikes: number;
  isTopInning: boolean;
  inning: number;
  batterName?: string;
  pitcherName?: string;
  catcherName?: string;
  firstRunnerName?: string;
  secondRunnerName?: string;
  thirdRunnerName?: string;
  firstBaseman?: string;
  secondBaseman?: string;
  shortstop?: string;
  thirdBaseman?: string;
  leftFielder?: string;
  centerFielder?: string;
  rightFielder?: string;
}

// Show middle + last name (or just last if no middle) to avoid showing just "Jr."
function shortName(name?: string, maxLen = 10): string {
  if (!name) return "";
  const parts = name.split(" ");
  if (parts.length <= 1) return name;
  // Drop first name, keep middle + last
  const rest = parts.slice(1).join(" ");
  return rest.length > maxLen ? rest.slice(0, maxLen) : rest;
}

export default function DiamondSVG({
  onFirst, onSecond, onThird,
  outs, balls, strikes,
  isTopInning, inning,
  batterName, pitcherName, catcherName,
  firstRunnerName, secondRunnerName, thirdRunnerName,
  firstBaseman, secondBaseman, shortstop, thirdBaseman,
  leftFielder, centerFielder, rightFielder,
}: DiamondSVGProps) {
  // viewBox 0 0 340 300 — plenty of room for labels
  return (
    <div className="flex items-start gap-5">
      <div>
        <svg width="320" height="290" viewBox="0 0 340 300" aria-label="Baseball diamond">
          {/* Outfield grass arc */}
          <path d="M 20,260 Q 170,20 320,260" fill="#0d1a0d" stroke="#1a2a1a" strokeWidth="1" />

          {/* Infield dirt diamond */}
          <polygon points="170,80 250,160 170,240 90,160" fill="#1a1610" stroke="#2a2a1a" strokeWidth="1" />

          {/* Base paths */}
          <line x1="170" y1="240" x2="250" y2="160" stroke="#444" strokeWidth="0.75" />
          <line x1="250" y1="160" x2="170" y2="80" stroke="#444" strokeWidth="0.75" />
          <line x1="170" y1="80" x2="90" y2="160" stroke="#444" strokeWidth="0.75" />
          <line x1="90" y1="160" x2="170" y2="240" stroke="#444" strokeWidth="0.75" />

          {/* Pitcher's mound */}
          <circle cx="170" cy="158" r="6" fill="#1a1610" stroke="#444" strokeWidth="0.5" />
          <rect x="167" y="156.5" width="6" height="2.5" rx="0.5" fill="#666" />

          {/* Home plate */}
          <polygon points="164,240 170,247 176,240 176,236 164,236" fill="#fff" stroke="#666" strokeWidth="0.5" />

          {/* ── Bases ── */}
          <rect x="244" y="154" width="12" height="12" rx="1.5" transform="rotate(45 250 160)"
            fill={onFirst ? "#fff" : "#1a1a1a"} stroke={onFirst ? "#fff" : "#444"} strokeWidth="1.5" />
          <rect x="164" y="74" width="12" height="12" rx="1.5" transform="rotate(45 170 80)"
            fill={onSecond ? "#fff" : "#1a1a1a"} stroke={onSecond ? "#fff" : "#444"} strokeWidth="1.5" />
          <rect x="84" y="154" width="12" height="12" rx="1.5" transform="rotate(45 90 160)"
            fill={onThird ? "#fff" : "#1a1a1a"} stroke={onThird ? "#fff" : "#444"} strokeWidth="1.5" />

          {/* ── Runner dots + names at base positions ── */}
          {onFirst && (
            <>
              <circle cx="250" cy="160" r="5" fill="#fff" stroke="#444" strokeWidth="0.5" />
              {firstRunnerName && (
                <text x="268" y="154" fill="#ddd" fontSize="9" fontFamily="monospace">{shortName(firstRunnerName)}</text>
              )}
            </>
          )}
          {onSecond && (
            <>
              <circle cx="170" cy="80" r="5" fill="#fff" stroke="#444" strokeWidth="0.5" />
              {secondRunnerName && (
                <text x="170" y="66" fill="#ddd" fontSize="9" fontFamily="monospace" textAnchor="middle">{shortName(secondRunnerName)}</text>
              )}
            </>
          )}
          {onThird && (
            <>
              <circle cx="90" cy="160" r="5" fill="#fff" stroke="#444" strokeWidth="0.5" />
              {thirdRunnerName && (
                <text x="72" y="154" fill="#ddd" fontSize="9" fontFamily="monospace" textAnchor="end">{shortName(thirdRunnerName)}</text>
              )}
            </>
          )}

          {/* ── Batter boxes ── */}
          <rect x="151" y="234" width="6" height="14" rx="0.5" fill="none" stroke="#444" strokeWidth="0.5" />
          <rect x="183" y="234" width="6" height="14" rx="0.5" fill="none" stroke="#444" strokeWidth="0.5" />

          {/* ── Catcher area ── */}
          <circle cx="170" cy="264" r="4" fill="#1a1a1a" stroke="#444" strokeWidth="0.5" />

          {/* ═══ Fielder position dots + labels ═══ */}

          {/* Pitcher - centered above mound */}
          {pitcherName && <>
            <text x="170" y="145" fill="#888" fontSize="8.5" fontFamily="monospace" textAnchor="middle">P</text>
            <text x="170" y="137" fill="#777" fontSize="8" fontFamily="monospace" textAnchor="middle">{shortName(pitcherName)}</text>
          </>}

          {/* Catcher - below home */}
          {catcherName && <>
            <text x="170" y="280" fill="#888" fontSize="8.5" fontFamily="monospace" textAnchor="middle">C</text>
            <text x="170" y="292" fill="#777" fontSize="8" fontFamily="monospace" textAnchor="middle">{shortName(catcherName)}</text>
          </>}

          {/* Batter - beside home */}
          {batterName && (
            <text x="170" y="256" fill="#aaa" fontSize="9" fontFamily="monospace" textAnchor="middle">{shortName(batterName)}</text>
          )}

          {/* 1B - right of first base line */}
          {firstBaseman && <>
            <circle cx="265" cy="180" r="3" fill="#333" />
            <text x="265" y="195" fill="#666" fontSize="7.5" fontFamily="monospace" textAnchor="middle">{shortName(firstBaseman)}</text>
          </>}

          {/* 2B - right of center infield */}
          {secondBaseman && <>
            <circle cx="210" cy="115" r="3" fill="#333" />
            <text x="210" y="108" fill="#666" fontSize="7.5" fontFamily="monospace" textAnchor="middle">{shortName(secondBaseman)}</text>
          </>}

          {/* SS - left of center infield */}
          {shortstop && <>
            <circle cx="130" cy="115" r="3" fill="#333" />
            <text x="130" y="108" fill="#666" fontSize="7.5" fontFamily="monospace" textAnchor="middle">{shortName(shortstop)}</text>
          </>}

          {/* 3B - left of third base line */}
          {thirdBaseman && <>
            <circle cx="75" cy="180" r="3" fill="#333" />
            <text x="75" y="195" fill="#666" fontSize="7.5" fontFamily="monospace" textAnchor="middle">{shortName(thirdBaseman)}</text>
          </>}

          {/* LF - far left outfield */}
          {leftFielder && <>
            <circle cx="60" cy="80" r="3" fill="#2a2a2a" />
            <text x="60" y="73" fill="#555" fontSize="7.5" fontFamily="monospace" textAnchor="middle">{shortName(leftFielder)}</text>
          </>}

          {/* CF - top center outfield */}
          {centerFielder && <>
            <circle cx="170" cy="42" r="3" fill="#2a2a2a" />
            <text x="170" y="35" fill="#555" fontSize="7.5" fontFamily="monospace" textAnchor="middle">{shortName(centerFielder)}</text>
          </>}

          {/* RF - far right outfield */}
          {rightFielder && <>
            <circle cx="280" cy="80" r="3" fill="#2a2a2a" />
            <text x="280" y="73" fill="#555" fontSize="7.5" fontFamily="monospace" textAnchor="middle">{shortName(rightFielder)}</text>
          </>}
        </svg>
      </div>

      {/* Count + Outs + Inning */}
      <div className="flex flex-col gap-3 pt-3">
        {/* Inning */}
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 10 10" aria-label={isTopInning ? "Top" : "Bottom"}>
            {isTopInning ? (
              <polygon points="5,1 9,7 1,7" fill="#fff" />
            ) : (
              <polygon points="5,9 9,3 1,3" fill="#fff" />
            )}
          </svg>
          <span className="text-base font-bold text-white tabular-nums">{inning}</span>
          <span className="text-[10px] text-muted">{isTopInning ? "TOP" : "BOT"}</span>
        </div>

        {/* Count */}
        <div className="space-y-1.5">
          <CountRow label="B" count={balls} max={4} color="bg-green-500" />
          <CountRow label="S" count={strikes} max={3} color="bg-red-500" />
          <CountRow label="O" count={outs} max={3} color="bg-yellow-500" />
        </div>

        {/* Runner summary */}
        <div className="text-[9px] text-muted mt-1 space-y-0.5">
          {onFirst && <div>1B: <span className="text-white/60">{shortName(firstRunnerName) || "runner"}</span></div>}
          {onSecond && <div>2B: <span className="text-white/60">{shortName(secondRunnerName) || "runner"}</span></div>}
          {onThird && <div>3B: <span className="text-white/60">{shortName(thirdRunnerName) || "runner"}</span></div>}
          {!onFirst && !onSecond && !onThird && <div>Bases empty</div>}
        </div>
      </div>
    </div>
  );
}

function CountRow({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-muted w-3 font-bold">{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${i < count ? color : "bg-[#1a1a1a] border border-[#2a2a2a]"}`}
          />
        ))}
      </div>
    </div>
  );
}
