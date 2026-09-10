import { NextResponse } from "next/server";
import { setCardApplicationStatus } from "@/lib/cardsRepo";
import type { ApplicationStatus } from "@/lib/types";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/cards/[id]/applied">,
) {
  try {
    const { id } = await ctx.params;
    const { status } = (await request.json()) as { status: ApplicationStatus };
    if (status !== 0 && status !== 1 && status !== 2) {
      return NextResponse.json({ error: "잘못된 값입니다." }, { status: 400 });
    }
    const card = await setCardApplicationStatus(id, status);
    return NextResponse.json(card);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "지원 상태를 변경하지 못했습니다." },
      { status: 500 },
    );
  }
}
