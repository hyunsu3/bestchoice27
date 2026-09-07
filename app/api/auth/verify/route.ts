import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  }
  return NextResponse.json({ ok: true });
}
