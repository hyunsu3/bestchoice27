import { NextResponse } from "next/server";
import { incrementCardView } from "@/lib/cardsRepo";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/cards/[id]/view">,
) {
  try {
    const { id } = await ctx.params;
    const viewCount = await incrementCardView(id);
    return NextResponse.json({ viewCount });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "조회수를 갱신하지 못했습니다." },
      { status: 500 },
    );
  }
}
