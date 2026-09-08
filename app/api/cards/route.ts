import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { listLatestApplicationStatByCard } from "@/lib/applicationStatsRepo";
import { insertCard, listCards } from "@/lib/cardsRepo";
import type { NewUniversityCard } from "@/lib/types";

export const dynamic = "force-dynamic";

function parseCapacityNumber(capacity: string): number | null {
  const match = capacity.match(/\d+/);
  return match ? Number(match[0]) : null;
}

export async function GET() {
  try {
    const [cards, latestStats] = await Promise.all([
      listCards(),
      listLatestApplicationStatByCard(),
    ]);
    const cardsWithRatio = cards.map((card) => {
      const stat = latestStats.get(card.id);
      if (!stat) return card;
      const capacity = parseCapacityNumber(card.capacity);
      return {
        ...card,
        latestApplicantCount: stat.applicantCount,
        latestRatioText: capacity
          ? `${(stat.applicantCount / capacity).toFixed(1)}:1`
          : null,
      };
    });
    return NextResponse.json(cardsWithRatio, {
      headers: { "Cache-Control": "no-store, must-revalidate" },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "카드 목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  }
  try {
    const body = (await request.json()) as NewUniversityCard;
    if (!body.universityName?.trim() || !body.department?.trim()) {
      return NextResponse.json(
        { error: "대학명과 희망학과는 필수입니다." },
        { status: 400 },
      );
    }
    const card = await insertCard(body);
    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "카드를 등록하지 못했습니다." },
      { status: 500 },
    );
  }
}
