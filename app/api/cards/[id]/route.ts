import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { deleteCardById, updateCardById } from "@/lib/cardsRepo";
import type { NewUniversityCard } from "@/lib/types";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/cards/[id]">,
) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  }
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as NewUniversityCard;
    const card = await updateCardById(id, body);
    return NextResponse.json(card);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "카드를 수정하지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/cards/[id]">,
) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  }
  try {
    const { id } = await ctx.params;
    await deleteCardById(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "카드를 삭제하지 못했습니다." },
      { status: 500 },
    );
  }
}
