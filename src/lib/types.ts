export interface NHLGame {
  id: number;
  season: number;
  gameType: number;
  gameDate: string;
  gameState: "FUT" | "PRE" | "LIVE" | "CRIT" | "OFF" | "FINAL";
  gameScheduleState: string;
  startTimeUTC: string;
  venue: { default: string };
  awayTeam: NHLTeam;
  homeTeam: NHLTeam;
  periodDescriptor?: {
    number: number;
    periodType: string;
    maxRegulationPeriods: number;
  };
  clock?: {
    timeRemaining: string;
    secondsRemaining: number;
    running: boolean;
    inIntermission: boolean;
  };
  gameCenterLink: string;
  gameOutcome?: {
    lastPeriodType: string;
  };
}

export interface NHLTeam {
  id: number;
  commonName: { default: string };
  placeName: { default: string };
  abbrev: string;
  score?: number;
  sog?: number;
  logo: string;
  darkLogo: string;
}

export interface NHLScheduleDay {
  date: string;
  dayAbbrev: string;
  numberOfGames: number;
  games: NHLGame[];
}

export interface NHLScheduleResponse {
  nextStartDate: string;
  previousStartDate: string;
  gameWeek: NHLScheduleDay[];
}

export interface PlayByPlayResponse {
  id: number;
  awayTeam: NHLTeam & { score: number; sog: number };
  homeTeam: NHLTeam & { score: number; sog: number };
  plays: GamePlay[];
  clock?: {
    timeRemaining: string;
    secondsRemaining: number;
    running: boolean;
    inIntermission: boolean;
  };
  periodDescriptor?: {
    number: number;
    periodType: string;
  };
  gameState: string;
  displayPeriod: number;
}

export interface GamePlay {
  eventId: number;
  periodDescriptor: {
    number: number;
    periodType: string;
  };
  timeInPeriod: string;
  timeRemaining: string;
  situationCode: string;
  typeCode: number;
  typeDescKey: string;
  sortOrder: number;
  details?: {
    xCoord?: number;
    yCoord?: number;
    zoneCode?: string;
    shotType?: string;
    scoringPlayerId?: number;
    shootingPlayerId?: number;
    playerId?: number;
    assist1PlayerId?: number;
    assist2PlayerId?: number;
    goalieInNetId?: number;
    awayScore?: number;
    homeScore?: number;
    awaySOG?: number;
    homeSOG?: number;
    reason?: string;
    duration?: number;
    committedByPlayerId?: number;
    drawnByPlayerId?: number;
    eventOwnerTeamId?: number;
    losingPlayerId?: number;
    winningPlayerId?: number;
    descKey?: string;
  };
}

export interface BoxscoreResponse {
  id: number;
  gameState: string;
  awayTeam: BoxscoreTeam;
  homeTeam: BoxscoreTeam;
  playerByGameStats: {
    awayTeam: PlayersByPosition;
    homeTeam: PlayersByPosition;
  };
  periodDescriptor?: {
    number: number;
    periodType: string;
  };
  clock?: {
    timeRemaining: string;
    secondsRemaining: number;
    running: boolean;
    inIntermission: boolean;
  };
}

export interface PlayersByPosition {
  forwards: SkaterStats[];
  defense: SkaterStats[];
  goalies: GoalieStats[];
}

export interface SkaterStats {
  playerId: number;
  sweaterNumber: number;
  name: { default: string };
  position: string;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  pim: number;
  hits: number;
  sog: number;
  faceoffWinningPctg: number;
  toi: string;
  blockedShots: number;
  shifts: number;
  giveaways: number;
  takeaways: number;
  powerPlayGoals: number;
}

export interface GoalieStats {
  playerId: number;
  sweaterNumber: number;
  name: { default: string };
  position: string;
  evenStrengthShotsAgainst: string;
  powerPlayShotsAgainst: string;
  shorthandedShotsAgainst: string;
  saveShotsAgainst: string;
  savePctg: number;
  goalsAgainst: number;
  pim: number;
  toi: string;
  starter: boolean;
  decision?: string;
}

export interface BoxscoreTeam {
  id: number;
  commonName: { default: string };
  abbrev: string;
  score: number;
  sog: number;
  logo: string;
  darkLogo: string;
}

// Landing page response (rich summary data)
export interface LandingResponse {
  id: number;
  gameState: string;
  awayTeam: NHLTeam & { score: number; sog: number };
  homeTeam: NHLTeam & { score: number; sog: number };
  shootoutInUse: boolean;
  otInUse: boolean;
  tvBroadcasts: TvBroadcast[];
  summary?: GameSummary;
  gameOutcome?: { lastPeriodType: string };
}

export interface TvBroadcast {
  id: number;
  market: string;
  countryCode: string;
  network: string;
  sequenceNumber: number;
}

export interface GameSummary {
  scoring?: ScoringPeriod[];
  penalties?: PenaltyPeriod[];
  threeStars?: ThreeStar[];
}

export interface ScoringPeriod {
  periodDescriptor: { number: number; periodType: string };
  goals: ScoringGoal[];
}

export interface ScoringGoal {
  situationCode: string;
  strength: string;
  playerId: number;
  firstName: { default: string };
  lastName: { default: string } | string;
  name: { default: string };
  teamAbbrev: { default: string };
  headshot: string;
  highlightClipSharingUrl?: string;
  goalsToDate: number;
  awayScore: number;
  homeScore: number;
  leadingTeamAbbrev?: { default: string };
  timeInPeriod: string;
  shotType: string;
  goalModifier: string;
  assists: ScoringAssist[];
  isHome: boolean;
}

export interface ScoringAssist {
  playerId: number;
  firstName: { default: string };
  lastName: { default: string } | string;
  name: { default: string };
  assistsToDate: number;
  sweaterNumber: number;
}

export interface PenaltyPeriod {
  periodDescriptor: { number: number; periodType: string };
  penalties: PenaltyEvent[];
}

export interface PenaltyEvent {
  timeInPeriod: string;
  type: string;
  duration: number;
  committedByPlayer?: {
    firstName: { default: string };
    lastName: { default: string } | string;
    sweaterNumber: number;
  };
  teamAbbrev: { default: string };
  drawnBy?: {
    firstName: { default: string };
    lastName: { default: string } | string;
    sweaterNumber: number;
  };
  descKey: string;
}

export interface ThreeStar {
  star: number;
  playerId: number;
  teamAbbrev: string;
  headshot: string;
  name: { default: string };
  sweaterNo: number;
  position: string;
  goals?: number;
  assists?: number;
  points?: number;
  goalsAgainstAverage?: number;
  savePctg?: number;
}

// Event type codes
export const EVENT_TYPES = {
  FACEOFF: 502,
  HIT: 503,
  GIVEAWAY: 504,
  GOAL: 505,
  SHOT: 506,
  MISSED_SHOT: 507,
  BLOCKED_SHOT: 508,
  PENALTY: 509,
  STOPPAGE: 516,
  PERIOD_START: 520,
  PERIOD_END: 521,
  GAME_END: 524,
  TAKEAWAY: 525,
  DELAYED_PENALTY: 535,
  FAILED_SHOT: 537,
} as const;
