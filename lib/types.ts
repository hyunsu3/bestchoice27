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
  applicationPeriod: string;
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
  applied: boolean;
  // 지원현황 기록 중 가장 최근 값에서 계산한 경쟁률. 카드 목록에 표시하기
  // 위한 파생값이라 DB에는 저장하지 않고 /api/cards 응답에서만 채운다.
  latestApplicantCount?: number | null;
  latestRatioText?: string | null;
}

export type NewUniversityCard = Omit<
  UniversityCard,
  | "id"
  | "createdAt"
  | "viewCount"
  | "pickTier"
  | "marked"
  | "held"
  | "applied"
  | "latestApplicantCount"
  | "latestRatioText"
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
