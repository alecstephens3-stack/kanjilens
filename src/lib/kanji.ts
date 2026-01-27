// Unicode property escape for all Han (kanji) characters + 々 iteration mark
const KANJI_REGEX = /[\p{Script=Han}々]/gu;

export function extractKanji(text: string): string[] {
  const matches = Array.from(text.matchAll(KANJI_REGEX), (m) => m[0]);
  if (matches.length === 0) return [];
  // Unique kanji in order of first appearance
  return [...new Set(matches)];
}

export function countOccurrences(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  const matches = Array.from(text.matchAll(KANJI_REGEX), (m) => m[0]);
  for (const char of matches) {
    counts.set(char, (counts.get(char) || 0) + 1);
  }
  return counts;
}

export interface KanjiWithScore {
  kanji: string;
  occurrences: number;
  isKnown: boolean;
  score: number;
}

export function prioritizeKanji(
  text: string,
  knownKanji: Map<string, { correct: number; wrong: number }>
): KanjiWithScore[] {
  const counts = countOccurrences(text);
  const results: KanjiWithScore[] = [];

  for (const [kanji, occurrences] of counts) {
    const mastery = knownKanji.get(kanji);
    const seenCount = mastery ? mastery.correct + mastery.wrong : 0;
    const isKnown = mastery ? mastery.correct > mastery.wrong : false;
    const score = occurrences * (seenCount + 1);
    results.push({ kanji, occurrences, isKnown, score });
  }

  // Unknown first, then sort by score descending
  results.sort((a, b) => {
    if (a.isKnown !== b.isKnown) return a.isKnown ? 1 : -1;
    return b.score - a.score;
  });

  return results;
}
