import { NextResponse } from "next/server";
import { insertCard, listCards } from "@/lib/cardsRepo";
import type { NewUniversityCard } from "@/lib/types";

export async function GET() {
  try {
    const cards = await listCards();
    return NextResponse.json(cards);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "카드 목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NewUniversityCard;
    if (!body.universityName?.trim() || !body.department?.trim()) {
      return NextResponse.json(
        { error: "대학명과 희망학과는 필수입니다." },
        { status: 400 },
      );
    }
    const card = await insertCard(body);
    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "카드를 등록하지 못했습니다." },
      { status: 500 },
    );
  }
}
