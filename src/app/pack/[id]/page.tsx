import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import PackClient from "./client";

interface PackItem {
  kanji: string;
  meaning: string[];
  readings: { onyomi: string[]; kunyomi: string[] };
  compounds: { word: string; reading: string; meaning: string }[];
  mnemonic: string;
  examples: { jp: string; reading: string; en: string }[];
  confusable?: string;
}

export default async function PackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pack = await prisma.studyPack.findUnique({ where: { id } });
  if (!pack) notFound();

  const packData = pack.packJson as unknown as { items: PackItem[] };

  return <PackClient packId={id} items={packData.items} />;
}
