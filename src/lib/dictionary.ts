import kanjiDict from "@/data/kanji-dict.json";

export interface KanjiEntry {
  meanings: string[];
  readings: { onyomi: string[]; kunyomi: string[] };
  compounds: { word: string; reading: string; meaning: string }[];
}

const dict = kanjiDict as Record<string, KanjiEntry>;

export function lookupKanji(kanji: string): KanjiEntry | null {
  return dict[kanji] || null;
}

export function hasKanji(kanji: string): boolean {
  return kanji in dict;
}
