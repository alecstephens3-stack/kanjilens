import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractKanji, countOccurrences, prioritizeKanji } from "../kanji";

describe("extractKanji", () => {
  it("extracts kanji from mixed Japanese text", () => {
    const text = "ゴミを捨てないで\n小イ捨て禁止";
    const result = extractKanji(text);
    // Should find: 捨, 小, 禁, 止 (ゴ/ミ/イ are katakana, not kanji)
    assert.ok(result.includes("捨"), "should contain 捨");
    assert.ok(result.includes("小"), "should contain 小");
    assert.ok(result.includes("禁"), "should contain 禁");
    assert.ok(result.includes("止"), "should contain 止");
    // Should NOT include katakana
    assert.ok(!result.includes("ゴ"), "should not contain ゴ");
    assert.ok(!result.includes("ミ"), "should not contain ミ");
    assert.ok(!result.includes("イ"), "should not contain イ");
  });

  it("returns unique kanji in order of appearance", () => {
    const text = "日本語の日記";
    const result = extractKanji(text);
    assert.deepEqual(result, ["日", "本", "語", "記"]);
  });

  it("handles complex/rare kanji", () => {
    const text = "薔薇の花が咲いた";
    const result = extractKanji(text);
    assert.ok(result.includes("薔"), "should contain 薔");
    assert.ok(result.includes("薇"), "should contain 薇");
    assert.ok(result.includes("花"), "should contain 花");
    assert.ok(result.includes("咲"), "should contain 咲");
  });

  it("handles 々 iteration mark", () => {
    const text = "人々が歩いている";
    const result = extractKanji(text);
    assert.ok(result.includes("人"), "should contain 人");
    assert.ok(result.includes("々"), "should contain 々");
    assert.ok(result.includes("歩"), "should contain 歩");
  });

  it("returns empty array for text with no kanji", () => {
    assert.deepEqual(extractKanji(""), []);
    assert.deepEqual(extractKanji("hello world"), []);
    assert.deepEqual(extractKanji("ひらがなだけ"), []);
    assert.deepEqual(extractKanji("カタカナダケ"), []);
  });
});

describe("countOccurrences", () => {
  it("counts kanji occurrences correctly", () => {
    const text = "日本語の日記を日々つける";
    const counts = countOccurrences(text);
    assert.equal(counts.get("日"), 3);
    assert.equal(counts.get("本"), 1);
    assert.equal(counts.get("語"), 1);
    assert.equal(counts.get("記"), 1);
    assert.equal(counts.get("々"), 1);
  });
});

describe("prioritizeKanji - unknown/known filtering", () => {
  it("marks kanji as unknown when not in mastery map", () => {
    const text = "捨禁止";
    const knownMap = new Map<string, { correct: number; wrong: number }>();
    const result = prioritizeKanji(text, knownMap);
    assert.ok(result.every((k) => !k.isKnown), "all should be unknown");
  });

  it("marks kanji as known when correct > wrong", () => {
    const text = "捨禁止";
    const knownMap = new Map([
      ["捨", { correct: 3, wrong: 1 }],
    ]);
    const result = prioritizeKanji(text, knownMap);
    const sute = result.find((k) => k.kanji === "捨");
    const kin = result.find((k) => k.kanji === "禁");
    assert.equal(sute?.isKnown, true, "捨 should be known");
    assert.equal(kin?.isKnown, false, "禁 should be unknown");
  });

  it("sorts unknown kanji first", () => {
    const text = "日本語";
    const knownMap = new Map([
      ["日", { correct: 5, wrong: 0 }],
      ["本", { correct: 0, wrong: 0 }],
    ]);
    const result = prioritizeKanji(text, knownMap);
    const unknownIdx = result.findIndex((k) => k.kanji === "語");
    const knownIdx = result.findIndex((k) => k.kanji === "日");
    assert.ok(unknownIdx < knownIdx, "unknown kanji should come before known");
  });
});
