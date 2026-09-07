import { NextResponse } from "next/server";
import { listApplicationStatsByCard } from "@/lib/applicationStatsRepo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const statsByCard = await listApplicationStatsByCard();
    return NextResponse.json(statsByCard, {
      headers: { "Cache-Control": "no-store, must-revalidate" },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "지원현황을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
