export type PickTier = "none" | "reach" | "target" | "safe";

export interface UniversityCard {
  id: string;
  universityName: string;
  department: string;
  admissionType: string;
  capacity: string;
  minRequirement: string;
  interviewDate: string;
  resultAnnouncementDate: string;
  admissionSummary: string;
  resultSummary: string;
  departmentLink: string;
  createdAt: number;
  viewCount: number;
  pickTier: PickTier;
  marked: boolean;
}

export type NewUniversityCard = Omit<
  UniversityCard,
  "id" | "createdAt" | "viewCount" | "pickTier" | "marked"
>;
