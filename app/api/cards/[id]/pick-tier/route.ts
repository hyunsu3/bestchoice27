import { NextResponse } from "next/server";
import { setCardPickTier } from "@/lib/cardsRepo";
import type { PickTier } from "@/lib/types";

const VALID_TIERS: PickTier[] = ["none", "reach", "target", "safe"];

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/cards/[id]/pick-tier">,
) {
  try {
    const { id } = await ctx.params;
    const { pickTier } = (await request.json()) as { pickTier: PickTier };
    if (!VALID_TIERS.includes(pickTier)) {
      return NextResponse.json({ error: "잘못된 값입니다." }, { status: 400 });
    }
    const card = await setCardPickTier(id, pickTier);
    return NextResponse.json(card);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "선택 상태를 변경하지 못했습니다." },
      { status: 500 },
    );
  }
}
