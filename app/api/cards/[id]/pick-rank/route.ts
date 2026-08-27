import { NextResponse } from "next/server";
import { setCardPickRank } from "@/lib/cardsRepo";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/cards/[id]/pick-rank">,
) {
  try {
    const { id } = await ctx.params;
    const { pickRank } = (await request.json()) as { pickRank: number };
    if (typeof pickRank !== "number" || !Number.isFinite(pickRank)) {
      return NextResponse.json({ error: "잘못된 값입니다." }, { status: 400 });
    }
    const card = await setCardPickRank(id, pickRank);
    return NextResponse.json(card);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "순서를 변경하지 못했습니다." },
      { status: 500 },
    );
  }
}
