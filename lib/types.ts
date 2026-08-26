export interface UniversityCard {
  id: string;
  universityName: string;
  department: string;
  admissionType: string;
  capacity: string;
  minRequirement: string;
  admissionSummary: string;
  resultSummary: string;
  createdAt: number;
  viewCount: number;
  isFavorite: boolean;
}

export type NewUniversityCard = Omit<
  UniversityCard,
  "id" | "createdAt" | "viewCount" | "isFavorite"
>;
