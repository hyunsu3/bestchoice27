import { supabaseAdmin } from "./supabaseAdmin";
import type { NewUniversityCard, PickTier, UniversityCard } from "./types";

type CardRow = {
  id: string;
  university_name: string;
  department: string;
  admission_type: string;
  capacity: string;
  min_requirement: string;
  interview_date: string;
  result_announcement_date: string;
  admission_summary: string;
  result_summary: string;
  department_link: string;
  created_at: string;
  view_count: number;
  pick_tier: PickTier;
  marked: boolean;
  held: boolean;
};

function toCard(row: CardRow): UniversityCard {
  return {
    id: row.id,
    universityName: row.university_name,
    department: row.department,
    admissionType: row.admission_type,
    capacity: row.capacity,
    minRequirement: row.min_requirement ?? "",
    interviewDate: row.interview_date ?? "",
    resultAnnouncementDate: row.result_announcement_date ?? "",
    admissionSummary: row.admission_summary,
    resultSummary: row.result_summary,
    departmentLink: row.department_link ?? "",
    createdAt: new Date(row.created_at).getTime(),
    viewCount: row.view_count ?? 0,
    pickTier: row.pick_tier ?? "none",
    marked: row.marked ?? false,
    held: row.held ?? false,
  };
}

function toRow(card: NewUniversityCard) {
  return {
    university_name: card.universityName,
    department: card.department,
    admission_type: card.admissionType,
    capacity: card.capacity,
    min_requirement: card.minRequirement,
    interview_date: card.interviewDate,
    result_announcement_date: card.resultAnnouncementDate,
    admission_summary: card.admissionSummary,
    result_summary: card.resultSummary,
    department_link: card.departmentLink,
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

export async function setCardPickTier(
  id: string,
  pickTier: PickTier,
): Promise<UniversityCard> {
  const { data, error } = await supabaseAdmin
    .from("cards")
    .update({ pick_tier: pickTier })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCard(data as CardRow);
}

export async function setCardMarked(
  id: string,
  marked: boolean,
): Promise<UniversityCard> {
  const { data, error } = await supabaseAdmin
    .from("cards")
    .update({ marked })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCard(data as CardRow);
}

export async function setCardHeld(
  id: string,
  held: boolean,
): Promise<UniversityCard> {
  const { data, error } = await supabaseAdmin
    .from("cards")
    .update({ held })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCard(data as CardRow);
}
