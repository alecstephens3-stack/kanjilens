import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { lookupKanji } from "@/lib/dictionary";

const DEMO_USER = "demo";

// Vercel serverless: allow up to 60s for LLM calls per kanji
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { scanId, kanjiList } = await req.json();

    if (!scanId || !Array.isArray(kanjiList) || kanjiList.length === 0) {
      return NextResponse.json(
        { error: "scanId and kanjiList required" },
        { status: 400 }
      );
    }

    const items = [];

    for (const kanji of kanjiList) {
      const dictEntry = lookupKanji(kanji);
      if (!dictEntry) continue;

      // Call n8n LLM webhook for mnemonic + examples
      let mnemonic = "Study this kanji by examining its radical components.";
      let examples: { jp: string; reading: string; en: string }[] = [];
      let confusable: string | null = null;

      try {
        const webhookUrl = `${process.env.N8N_WEBHOOK_URL}/webhook/kanjilens-generate`;
        const llmResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kanji,
            meanings: dictEntry.meanings,
            readings: dictEntry.readings,
            compounds: dictEntry.compounds,
          }),
        });

        if (llmResponse.ok) {
          const llmData = await llmResponse.json();
          if (llmData.mnemonic) mnemonic = llmData.mnemonic;
          if (Array.isArray(llmData.examples)) examples = llmData.examples;
          if (llmData.confusable) confusable = llmData.confusable;
        }
      } catch {
        // Use defaults if LLM call fails
      }

      items.push({
        kanji,
        meaning: dictEntry.meanings,
        readings: dictEntry.readings,
        compounds: dictEntry.compounds,
        mnemonic,
        examples,
        ...(confusable ? { confusable } : {}),
      });
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "No valid kanji found in dictionary" },
        { status: 400 }
      );
    }

    // Create study pack
    const pack = await prisma.studyPack.create({
      data: {
        scanId,
        packJson: { items },
      },
    });

    // Upsert kanji mastery records
    for (const item of items) {
      await prisma.kanjiMastery.upsert({
        where: {
          userId_kanji: { userId: DEMO_USER, kanji: item.kanji },
        },
        create: {
          userId: DEMO_USER,
          kanji: item.kanji,
        },
        update: {},
      });
    }

    return NextResponse.json({ id: pack.id });
  } catch (error) {
    console.error("Pack error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const pack = await prisma.studyPack.findUnique({ where: { id } });
  if (!pack) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(pack);
}
