"use client";

import { useState } from "react";
import Link from "next/link";

interface PackItem {
  kanji: string;
  meaning: string[];
  readings: { onyomi: string[]; kunyomi: string[] };
  compounds: { word: string; reading: string; meaning: string }[];
  mnemonic: string;
  examples: { jp: string; reading: string; en: string }[];
  confusable?: string;
}

export default function PackClient({
  packId,
  items,
}: {
  packId: string;
  items: PackItem[];
}) {
  const [expanded, setExpanded] = useState<number>(0);

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="text-sm text-ink-light hover:text-gold transition-colors"
          >
            ← Back
          </Link>
          <h1 className="font-serif text-3xl font-bold text-deep-indigo mt-1">
            Study Pack
          </h1>
        </div>
        <span className="text-sm text-paper font-medium bg-indigo-deep px-4 py-1.5 rounded-full shadow-ukiyo">
          {items.length} kanji
        </span>
      </header>

      {/* Kanji Selector — tiles with ukiyo-e styling */}
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <button
            key={item.kanji}
            onClick={() => setExpanded(i)}
            className={`
              w-14 h-14 rounded-xl font-serif text-2xl
              flex items-center justify-center
              transition-all duration-200 btn-transition
              ${expanded === i
                ? "bg-crimson text-white shadow-ukiyo scale-110 border-2 border-crimson-dark"
                : "bg-paper-light text-ink-dark shadow-paper hover:shadow-paper-hover border border-parchment hover:border-gold"
              }
            `}
          >
            {item.kanji}
          </button>
        ))}
      </div>

      {/* Kanji Detail Card */}
      {items[expanded] && (
        <KanjiCard key={expanded} item={items[expanded]} index={expanded} />
      )}

      {/* Start Review Button */}
      <Link
        href={`/review/${packId}`}
        className="
          block w-full text-center py-4 px-6 rounded-xl
          font-medium text-lg
          bg-indigo-deep text-paper shadow-ukiyo
          hover:shadow-paper-hover transition-all duration-200 btn-transition btn-gold
        "
      >
        <span className="relative z-10">Start Review</span>
      </Link>
    </div>
  );
}

function KanjiCard({ item, index }: { item: PackItem; index: number }) {
  return (
    <div
      className="animate-fade-in-scale bg-paper-light rounded-2xl shadow-ukiyo overflow-hidden border-gold-frame"
    >
      {/* Header with large kanji — deep indigo block */}
      <div className="bg-indigo-deep p-8 text-center pattern-diamond overflow-hidden relative">
        <span className="relative z-10 font-serif text-8xl text-paper drop-shadow-lg">{item.kanji}</span>
        <p className="relative z-10 mt-4 text-xl text-gold font-medium">
          {item.meaning.join(" · ")}
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Readings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-2">
              On&apos;yomi
            </p>
            <div className="flex flex-wrap gap-1.5">
              {item.readings.onyomi.length > 0 ? (
                item.readings.onyomi.map((r) => (
                  <span
                    key={r}
                    className="px-3 py-1 rounded-full bg-indigo-deep/10 text-indigo-deep text-sm font-medium"
                  >
                    {r}
                  </span>
                ))
              ) : (
                <span className="text-ink-faint text-sm">—</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-2">
              Kun&apos;yomi
            </p>
            <div className="flex flex-wrap gap-1.5">
              {item.readings.kunyomi.length > 0 ? (
                item.readings.kunyomi.map((r) => (
                  <span
                    key={r}
                    className="px-3 py-1 rounded-full bg-parchment text-ink-medium text-sm font-medium"
                  >
                    {r}
                  </span>
                ))
              ) : (
                <span className="text-ink-faint text-sm">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Compounds */}
        {item.compounds.length > 0 && (
          <div>
            <p className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-3">
              Compounds
            </p>
            <div className="space-y-2">
              {item.compounds.map((c) => (
                <div
                  key={c.word}
                  className="flex items-baseline gap-3 text-sm"
                >
                  <span className="font-serif text-xl text-ink-dark">{c.word}</span>
                  <span className="text-ink-light">({c.reading})</span>
                  <span className="text-ink-medium">{c.meaning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mnemonic — crimson-accented card */}
        <div className="bg-crimson/5 border border-crimson/20 rounded-xl p-4">
          <p className="text-xs font-medium text-crimson uppercase tracking-wide mb-2">
            Memory Tip
          </p>
          <p className="text-ink-dark leading-relaxed">{item.mnemonic}</p>
        </div>

        {/* Examples */}
        {item.examples.length > 0 && (
          <div>
            <p className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-3">
              Examples
            </p>
            <div className="space-y-3">
              {item.examples.map((ex, i) => (
                <div
                  key={i}
                  className="pl-4 border-l-2 border-gold"
                >
                  <p className="font-serif text-lg text-ink-dark">{ex.jp}</p>
                  {ex.reading && (
                    <p className="text-sm text-ink-light mt-0.5">{ex.reading}</p>
                  )}
                  <p className="text-sm text-ink-medium mt-1">{ex.en}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confusable Warning */}
        {item.confusable && (
          <div className="bg-gold/10 border border-gold/30 rounded-xl p-4">
            <p className="text-xs font-medium text-gold uppercase tracking-wide mb-2">
              Watch out
            </p>
            <p className="text-ink-dark text-sm">{item.confusable}</p>
          </div>
        )}
      </div>
    </div>
  );
}
