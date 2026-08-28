import { NextResponse } from "next/server";
import { setCardMarked } from "@/lib/cardsRepo";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/cards/[id]/marked">,
) {
  try {
    const { id } = await ctx.params;
    const { marked } = (await request.json()) as { marked: boolean };
    if (typeof marked !== "boolean") {
      return NextResponse.json({ error: "잘못된 값입니다." }, { status: 400 });
    }
    const card = await setCardMarked(id, marked);
    return NextResponse.json(card);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "표시 상태를 변경하지 못했습니다." },
      { status: 500 },
    );
  }
}
