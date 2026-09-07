import { NextResponse } from "next/server";
import { setCardApplied } from "@/lib/cardsRepo";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/cards/[id]/applied">,
) {
  try {
    const { id } = await ctx.params;
    const { applied } = (await request.json()) as { applied: boolean };
    if (typeof applied !== "boolean") {
      return NextResponse.json({ error: "잘못된 값입니다." }, { status: 400 });
    }
    const card = await setCardApplied(id, applied);
    return NextResponse.json(card);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "지원완료 상태를 변경하지 못했습니다." },
      { status: 500 },
    );
  }
}
