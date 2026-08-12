import { supabaseAdmin } from "./supabaseAdmin";
import type { NewUniversityCard, UniversityCard } from "./types";

type CardRow = {
  id: string;
  university_name: string;
  department: string;
  admission_type: string;
  capacity: string;
  admission_summary: string;
  result_summary: string;
  created_at: string;
  view_count: number;
};

function toCard(row: CardRow): UniversityCard {
  return {
    id: row.id,
    universityName: row.university_name,
    department: row.department,
    admissionType: row.admission_type,
    capacity: row.capacity,
    admissionSummary: row.admission_summary,
    resultSummary: row.result_summary,
    createdAt: new Date(row.created_at).getTime(),
    viewCount: row.view_count ?? 0,
  };
}

function toRow(card: NewUniversityCard) {
  return {
    university_name: card.universityName,
    department: card.department,
    admission_type: card.admissionType,
    capacity: card.capacity,
    admission_summary: card.admissionSummary,
    result_summary: card.resultSummary,
  };
}

export async function listCards(): Promise<UniversityCard[]> {
  const { data, error } = await supabaseAdmin
    .from("cards")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as CardRow[]).map(toCard);
}

export async function insertCard(
  card: NewUniversityCard,
): Promise<UniversityCard> {
  const { data, error } = await supabaseAdmin
    .from("cards")
    .insert(toRow(card))
    .select()
    .single();
  if (error) throw error;
  return toCard(data as CardRow);
}

export async function insertCards(
  cards: NewUniversityCard[],
): Promise<UniversityCard[]> {
  if (cards.length === 0) return [];
  const { data, error } = await supabaseAdmin
    .from("cards")
    .insert(cards.map(toRow))
    .select();
  if (error) throw error;
  return (data as CardRow[]).map(toCard);
}

export async function updateCardById(
  id: string,
  patch: NewUniversityCard,
): Promise<UniversityCard> {
  const { data, error } = await supabaseAdmin
    .from("cards")
    .update(toRow(patch))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCard(data as CardRow);
}

export async function deleteCardById(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("cards").delete().eq("id", id);
  if (error) throw error;
}

export async function incrementCardView(id: string): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc("increment_card_view", {
    card_id: id,
  });
  if (error) throw error;
  return data as number;
}
