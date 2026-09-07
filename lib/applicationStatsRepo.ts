import { supabaseAdmin } from "./supabaseAdmin";
import type { ApplicationStat, NewApplicationStat } from "./types";

type StatRow = {
  id: string;
  card_id: string;
  recorded_at: string;
  applicant_count: number;
  created_at: string;
};

function toStat(row: StatRow): ApplicationStat {
  return {
    id: row.id,
    cardId: row.card_id,
    recordedAt: new Date(row.recorded_at).getTime(),
    applicantCount: row.applicant_count,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function listApplicationStats(
  cardId: string,
): Promise<ApplicationStat[]> {
  const { data, error } = await supabaseAdmin
    .from("application_stats")
    .select("*")
    .eq("card_id", cardId)
    .order("recorded_at", { ascending: true });
  if (error) throw error;
  return (data as StatRow[]).map(toStat);
}

export async function listApplicationStatsByCard(): Promise<
  Record<string, ApplicationStat[]>
> {
  const { data, error } = await supabaseAdmin
    .from("application_stats")
    .select("*")
    .order("recorded_at", { ascending: true });
  if (error) throw error;
  const grouped: Record<string, ApplicationStat[]> = {};
  for (const row of data as StatRow[]) {
    const stat = toStat(row);
    (grouped[stat.cardId] ??= []).push(stat);
  }
  return grouped;
}

export async function insertApplicationStat(
  cardId: string,
  stat: NewApplicationStat,
): Promise<ApplicationStat> {
  const { data, error } = await supabaseAdmin
    .from("application_stats")
    .insert({
      card_id: cardId,
      recorded_at: new Date(stat.recordedAt).toISOString(),
      applicant_count: stat.applicantCount,
    })
    .select()
    .single();
  if (error) throw error;
  return toStat(data as StatRow);
}

export async function deleteApplicationStatById(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("application_stats")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
