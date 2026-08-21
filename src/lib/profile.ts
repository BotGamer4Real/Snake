import { loadHighScore, saveHighScore } from "@/game/progress";
import { getSupabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  display_name: string;
  high_score: number;
};

export async function fetchProfile(): Promise<Profile | null> {
  const supabase = getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, high_score")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function recordCloudHighScore(score: number): Promise<number | null> {
  const supabase = getSupabase();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return null;

  const { data, error } = await supabase.rpc("record_high_score", { p_score: score });
  if (error) throw error;
  return typeof data === "number" ? data : Number(data);
}

export async function mergeHighScoreWithCloud(): Promise<number> {
  const local = loadHighScore();
  try {
    const profile = await fetchProfile();
    if (!profile) return local;
    const merged = Math.max(local, profile.high_score);
    saveHighScore(merged);
    if (merged > profile.high_score) {
      const remote = await recordCloudHighScore(merged);
      return remote ?? merged;
    }
    return merged;
  } catch {
    return local;
  }
}

export async function persistHighScore(score: number): Promise<number> {
  const local = saveHighScore(score);
  try {
    const remote = await recordCloudHighScore(local);
    const merged = Math.max(local, remote ?? 0);
    saveHighScore(merged);
    return merged;
  } catch {
    return local;
  }
}
