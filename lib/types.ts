export interface UniversityCard {
  id: string;
  universityName: string;
  department: string;
  admissionType: string;
  capacity: string;
  admissionSummary: string;
  resultSummary: string;
  createdAt: number;
}

export type NewUniversityCard = Omit<UniversityCard, "id" | "createdAt">;
