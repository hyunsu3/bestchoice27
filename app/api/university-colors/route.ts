import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { listUniversityColors, setUniversityColor } from "@/lib/universityColorsRepo";

export async function GET() {
  try {
    const colors = await listUniversityColors();
    return NextResponse.json(colors);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "색상 정보를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  }
  try {
    const body = (await request.json()) as {
      universityName?: string;
      color?: string;
    };
    const universityName = body.universityName?.trim();
    const color = body.color?.trim();
    if (!universityName || !color) {
      return NextResponse.json(
        { error: "대학명과 색상이 필요합니다." },
        { status: 400 },
      );
    }
    await setUniversityColor(universityName, color);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "색상을 저장하지 못했습니다." },
      { status: 500 },
    );
  }
}
