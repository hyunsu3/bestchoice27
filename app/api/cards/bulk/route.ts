import { NextResponse } from "next/server";
import { insertCards } from "@/lib/cardsRepo";
import type { NewUniversityCard } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NewUniversityCard[];
    const valid = body.filter(
      (c) => c.universityName?.trim() && c.department?.trim(),
    );
    const cards = await insertCards(valid);
    return NextResponse.json(cards, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "카드를 업로드하지 못했습니다." },
      { status: 500 },
    );
  }
}
