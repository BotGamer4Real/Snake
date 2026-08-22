import { loadAllHighScores, saveHighScore } from "@/game/progress";
import { isGameId, type GameId } from "@/lib/games";
import { getSupabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  display_name: string;
};

export const HIGH_SCORE_SYNC_EVENT = "arcade-high-score-sync";

export type HighScoreSyncDetail = {
  gameId: GameId;
  highScore: number;
};

function notifyScore(gameId: GameId, highScore: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<HighScoreSyncDetail>(HIGH_SCORE_SYNC_EVENT, {
      detail: { gameId, highScore },
    }),
  );
}

export async function fetchProfile(): Promise<Profile | null> {
  const supabase = getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function recordCloudHighScore(
  gameId: GameId,
  score: number,
): Promise<number | null> {
  const supabase = getSupabase();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return null;

  const { data, error } = await supabase.rpc("record_game_high_score", {
    p_game_id: gameId,
    p_score: score,
  });
  if (error) throw error;
  return typeof data === "number" ? data : Number(data);
}

export async function mergeAllHighScores(): Promise<Record<GameId, number>> {
  const scores = loadAllHighScores();
  try {
    const supabase = getSupabase();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return scores;

    const { data, error } = await supabase
      .from("game_scores")
      .select("game_id, high_score")
      .eq("user_id", userData.user.id);
    if (error) throw error;

    for (const row of data ?? []) {
      if (!isGameId(row.game_id)) continue;
      const local = scores[row.game_id];
      const merged = Math.max(local, row.high_score);
      saveHighScore(row.game_id, merged);
      if (merged > row.high_score) {
        const remote = await recordCloudHighScore(row.game_id, merged);
        scores[row.game_id] = remote ?? merged;
      } else {
        scores[row.game_id] = merged;
      }
      notifyScore(row.game_id, scores[row.game_id]);
    }
    return scores;
  } catch {
    return scores;
  }
}

export async function persistHighScore(gameId: GameId, score: number): Promise<number> {
  const local = saveHighScore(gameId, score);
  try {
    const remote = await recordCloudHighScore(gameId, local);
    const merged = Math.max(local, remote ?? 0);
    saveHighScore(gameId, merged);
    notifyScore(gameId, merged);
    return merged;
  } catch {
    notifyScore(gameId, local);
    return local;
  }
}
