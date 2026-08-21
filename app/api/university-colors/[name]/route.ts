import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { deleteUniversityColor } from "@/lib/universityColorsRepo";

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/university-colors/[name]">,
) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  }
  try {
    const { name } = await ctx.params;
    await deleteUniversityColor(decodeURIComponent(name));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "색상을 삭제하지 못했습니다." },
      { status: 500 },
    );
  }
}
