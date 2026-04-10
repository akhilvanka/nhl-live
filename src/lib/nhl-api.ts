import {
  NHLScheduleResponse,
  NHLScheduleDay,
  PlayByPlayResponse,
  BoxscoreResponse,
} from "./types";

const BASE_URL = "https://api-web.nhle.com/v1";

export async function fetchSchedule(date: string): Promise<NHLScheduleDay | null> {
  const res = await fetch(`${BASE_URL}/schedule/${date}`);
  if (!res.ok) return null;
  const data: NHLScheduleResponse = await res.json();
  return data.gameWeek.find((d) => d.date === date) ?? null;
}

export async function fetchPlayByPlay(
  gameId: number
): Promise<PlayByPlayResponse | null> {
  const res = await fetch(`${BASE_URL}/gamecenter/${gameId}/play-by-play`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchBoxscore(
  gameId: number
): Promise<BoxscoreResponse | null> {
  const res = await fetch(`${BASE_URL}/gamecenter/${gameId}/boxscore`);
  if (!res.ok) return null;
  return res.json();
}
