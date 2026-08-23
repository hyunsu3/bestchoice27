import { NextResponse } from "next/server";
import { setCardFavorite } from "@/lib/cardsRepo";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/cards/[id]/favorite">,
) {
  try {
    const { id } = await ctx.params;
    const { isFavorite } = (await request.json()) as { isFavorite: boolean };
    const card = await setCardFavorite(id, !!isFavorite);
    return NextResponse.json(card);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "즐겨찾기 상태를 변경하지 못했습니다." },
      { status: 500 },
    );
  }
}
