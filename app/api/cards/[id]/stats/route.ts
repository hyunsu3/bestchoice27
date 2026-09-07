import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import {
  insertApplicationStat,
  listApplicationStats,
} from "@/lib/applicationStatsRepo";
import type { NewApplicationStat } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/cards/[id]/stats">,
) {
  try {
    const { id } = await ctx.params;
    const stats = await listApplicationStats(id);
    return NextResponse.json(stats, {
      headers: { "Cache-Control": "no-store, must-revalidate" },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "지원현황 기록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/cards/[id]/stats">,
) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  }
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as NewApplicationStat;
    if (
      typeof body.recordedAt !== "number" ||
      !Number.isFinite(body.recordedAt) ||
      typeof body.applicantCount !== "number" ||
      !Number.isFinite(body.applicantCount) ||
      body.applicantCount < 0
    ) {
      return NextResponse.json({ error: "잘못된 값입니다." }, { status: 400 });
    }
    const stat = await insertApplicationStat(id, body);
    return NextResponse.json(stat, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "지원현황을 기록하지 못했습니다." },
      { status: 500 },
    );
  }
}
