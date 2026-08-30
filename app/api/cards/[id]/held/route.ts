import { NextResponse } from "next/server";
import { setCardHeld } from "@/lib/cardsRepo";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/cards/[id]/held">,
) {
  try {
    const { id } = await ctx.params;
    const { held } = (await request.json()) as { held: boolean };
    if (typeof held !== "boolean") {
      return NextResponse.json({ error: "잘못된 값입니다." }, { status: 400 });
    }
    const card = await setCardHeld(id, held);
    return NextResponse.json(card);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "보류 상태를 변경하지 못했습니다." },
      { status: 500 },
    );
  }
}
