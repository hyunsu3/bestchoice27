import { supabaseAdmin } from "./supabaseAdmin";

export async function listUniversityColors(): Promise<Record<string, string>> {
  const { data, error } = await supabaseAdmin
    .from("university_colors")
    .select("university_name, color");
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const row of data as { university_name: string; color: string }[]) {
    map[row.university_name] = row.color;
  }
  return map;
}

export async function setUniversityColor(
  universityName: string,
  color: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("university_colors")
    .upsert({ university_name: universityName, color });
  if (error) throw error;
}

export async function deleteUniversityColor(
  universityName: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("university_colors")
    .delete()
    .eq("university_name", universityName);
  if (error) throw error;
}
