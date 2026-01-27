import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { extractKanji, prioritizeKanji } from "@/lib/kanji";
import { hasKanji } from "@/lib/dictionary";
import ScanClient from "./client";

export default async function ScanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scan = await prisma.scan.findUnique({ where: { id } });
  if (!scan) notFound();

  const text = scan.extractedText || "";
  const allKanji = extractKanji(text);

  // Get mastery data for known/unknown classification
  const masteryRecords = await prisma.kanjiMastery.findMany({
    where: { userId: "demo", kanji: { in: allKanji } },
  });

  const knownSet = new Set(
    masteryRecords
      .filter((m) => m.correct > m.wrong)
      .map((m) => m.kanji)
  );

  const knownMap = new Map(
    masteryRecords.map((m) => [m.kanji, { correct: m.correct, wrong: m.wrong }])
  );

  const prioritized = prioritizeKanji(text, knownMap);

  // Filter to only kanji in our dictionary
  const available = prioritized.filter((k) => hasKanji(k.kanji));

  // Debug info for development
  const debug = {
    rawOcrText: text,
    extractedKanji: allKanji,
    knownKanji: [...knownSet],
    unknownKanji: allKanji.filter((k) => !knownSet.has(k)),
    inDictionary: available.map((k) => k.kanji),
    droppedByDict: allKanji.filter((k) => !hasKanji(k)),
  };
  console.log("[ScanPage] debug:", JSON.stringify(debug, null, 2));

  return (
    <ScanClient
      scanId={scan.id}
      text={text}
      kanji={available}
      imagePath={scan.imagePath}
      debug={debug}
    />
  );
}
