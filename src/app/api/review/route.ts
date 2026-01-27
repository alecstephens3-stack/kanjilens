import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateSrs, type Rating } from "@/lib/srs";

const DEMO_USER = "demo";

export async function POST(req: NextRequest) {
  try {
    const { kanji, rating } = await req.json();

    if (!kanji || !["again", "hard", "good", "easy"].includes(rating)) {
      return NextResponse.json(
        { error: "kanji and valid rating required" },
        { status: 400 }
      );
    }

    const current = await prisma.kanjiMastery.findUnique({
      where: { userId_kanji: { userId: DEMO_USER, kanji } },
    });

    if (!current) {
      return NextResponse.json({ error: "Kanji not found" }, { status: 404 });
    }

    const newState = calculateSrs(
      {
        ease: current.ease,
        intervalDays: current.intervalDays,
        dueAt: current.dueAt,
        correct: current.correct,
        wrong: current.wrong,
      },
      rating as Rating
    );

    const updated = await prisma.kanjiMastery.update({
      where: { userId_kanji: { userId: DEMO_USER, kanji } },
      data: {
        ease: newState.ease,
        intervalDays: newState.intervalDays,
        dueAt: newState.dueAt,
        correct: newState.correct,
        wrong: newState.wrong,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Review error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
