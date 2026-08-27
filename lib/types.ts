export type PickTier = "none" | "reach" | "target" | "safe";

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
  pickTier: PickTier;
  pickRank: number;
}

export type NewUniversityCard = Omit<
  UniversityCard,
  "id" | "createdAt" | "viewCount" | "pickTier" | "pickRank"
> & {
  pickRank?: number;
};
