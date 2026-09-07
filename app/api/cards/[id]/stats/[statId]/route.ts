import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { deleteApplicationStatById } from "@/lib/applicationStatsRepo";

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/cards/[id]/stats/[statId]">,
) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  }
  try {
    const { statId } = await ctx.params;
    await deleteApplicationStatById(statId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "지원현황 기록을 삭제하지 못했습니다." },
      { status: 500 },
    );
  }
}
