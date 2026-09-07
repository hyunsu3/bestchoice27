export type PickTier = "none" | "reach" | "target" | "safe" | "cosmicReach";

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
  ratio2026: string;
  ratio2025: string;
  ratio2024: string;
  applyDeadlineDate: string;
  applyDeadlineTime: string;
  createdAt: number;
  viewCount: number;
  pickTier: PickTier;
  marked: boolean;
  held: boolean;
}

export type NewUniversityCard = Omit<
  UniversityCard,
  "id" | "createdAt" | "viewCount" | "pickTier" | "marked" | "held"
>;

export interface ApplicationStat {
  id: string;
  cardId: string;
  recordedAt: number;
  applicantCount: number;
  createdAt: number;
}

export type NewApplicationStat = Pick<
  ApplicationStat,
  "recordedAt" | "applicantCount"
>;
