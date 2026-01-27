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
}

type Rating = "again" | "hard" | "good" | "easy";

const RATING_CONFIG = {
  again: {
    label: "Again",
    bg: "bg-crimson/10 hover:bg-crimson/20",
    text: "text-crimson",
    ring: "ring-crimson/30",
  },
  hard: {
    label: "Hard",
    bg: "bg-gold/10 hover:bg-gold/20",
    text: "text-gold",
    ring: "ring-gold/30",
  },
  good: {
    label: "Good",
    bg: "bg-forest/10 hover:bg-forest/20",
    text: "text-forest",
    ring: "ring-forest/30",
  },
  easy: {
    label: "Easy",
    bg: "bg-indigo-deep/10 hover:bg-indigo-deep/20",
    text: "text-indigo-deep",
    ring: "ring-indigo-deep/30",
  },
};

export default function ReviewClient({ items }: { items: PackItem[] }) {
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isFlipping, setIsFlipping] = useState(false);

  const item = items[current];
  const progress = (current / items.length) * 100;

  async function handleRate(rating: Rating) {
    // Submit rating
    await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kanji: item.kanji, rating }),
    });

    setRatings([...ratings, rating]);

    // Animate flip back before moving to next card
    setIsFlipping(true);
    setFlipped(false);

    setTimeout(() => {
      setIsFlipping(false);
      if (current + 1 >= items.length) {
        setDone(true);
      } else {
        setCurrent(current + 1);
      }
    }, 400);
  }

  function handleFlip() {
    if (!flipped && !isFlipping) {
      setFlipped(true);
    }
  }

  if (done) {
    const summary = {
      again: ratings.filter((r) => r === "again").length,
      hard: ratings.filter((r) => r === "hard").length,
      good: ratings.filter((r) => r === "good").length,
      easy: ratings.filter((r) => r === "easy").length,
    };
    const total = items.length;

    return (
      <div className="animate-fade-in space-y-8 text-center py-8">
        {/* Completion Icon — gold circle with check */}
        <div className="mx-auto w-24 h-24 rounded-full bg-gold/20 flex items-center justify-center shadow-gold">
          <svg
            className="w-12 h-12 text-gold"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <div>
          <h1 className="font-serif text-3xl font-bold text-deep-indigo">
            Review Complete
          </h1>
          <p className="text-ink-medium mt-2">
            You reviewed {total} kanji
          </p>
        </div>

        {/* Stats Grid — themed rating cards */}
        <div className="grid grid-cols-4 gap-3">
          {(Object.keys(RATING_CONFIG) as Rating[]).map((rating) => {
            const config = RATING_CONFIG[rating];
            const count = summary[rating];
            return (
              <div
                key={rating}
                className={`${config.bg} rounded-xl p-4 transition-colors border border-transparent`}
              >
                <p className={`font-serif text-3xl font-bold ${config.text}`}>
                  {count}
                </p>
                <p className={`text-sm ${config.text} opacity-70 font-medium`}>
                  {config.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Link
            href="/"
            className="
              block w-full py-4 px-6 rounded-xl
              font-medium text-lg
              bg-crimson text-white shadow-ukiyo
              hover:shadow-paper-hover transition-all duration-200 btn-transition btn-gold
            "
          >
            <span className="relative z-10">Back to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-deep-indigo">
          Review
        </h1>
        <span className="text-sm text-paper font-medium bg-indigo-deep px-3 py-1.5 rounded-full shadow-ukiyo">
          {current + 1} / {items.length}
        </span>
      </header>

      {/* Progress Bar — gold fill on parchment track */}
      <div className="relative h-2 bg-parchment rounded-full overflow-hidden shadow-inner">
        <div
          className="absolute inset-y-0 left-0 bg-gold rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 3D Flip Card */}
      <div className="perspective h-[400px]">
        <div
          onClick={handleFlip}
          className={`
            relative w-full h-full cursor-pointer
            preserve-3d transition-transform duration-500 ease-out
            ${flipped ? "rotate-y-180" : ""}
          `}
        >
          {/* Front Face — deep indigo with pattern */}
          <div className="absolute inset-0 backface-hidden">
            <div className="h-full bg-indigo-deep rounded-2xl shadow-ukiyo flex flex-col items-center justify-center p-8 pattern-diamond overflow-hidden relative">
              <span className="relative z-10 font-serif text-9xl text-paper drop-shadow-lg">
                {item.kanji}
              </span>
              <p className="relative z-10 mt-8 text-gold/60 text-sm animate-pulse">
                Tap to reveal
              </p>
            </div>
          </div>

          {/* Back Face — paper with gold frame */}
          <div className="absolute inset-0 backface-hidden rotate-y-180">
            <div className="h-full bg-paper-light rounded-2xl shadow-ukiyo border-gold-frame overflow-auto p-6">
              <div className="space-y-4">
                {/* Kanji & Meaning */}
                <div className="text-center pb-4 border-b-2 border-parchment">
                  <span className="font-serif text-6xl text-deep-indigo">
                    {item.kanji}
                  </span>
                  <p className="mt-2 text-lg font-medium text-ink-medium">
                    {item.meaning.join(" · ")}
                  </p>
                </div>

                {/* Readings */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-ink-faint uppercase mb-1.5">On&apos;yomi</p>
                    <div className="flex flex-wrap gap-1">
                      {item.readings.onyomi.length > 0 ? (
                        item.readings.onyomi.map((r) => (
                          <span
                            key={r}
                            className="px-2 py-0.5 rounded-full bg-indigo-deep/10 text-indigo-deep text-xs font-medium"
                          >
                            {r}
                          </span>
                        ))
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-ink-faint uppercase mb-1.5">Kun&apos;yomi</p>
                    <div className="flex flex-wrap gap-1">
                      {item.readings.kunyomi.length > 0 ? (
                        item.readings.kunyomi.map((r) => (
                          <span
                            key={r}
                            className="px-2 py-0.5 rounded-full bg-parchment text-ink-medium text-xs font-medium"
                          >
                            {r}
                          </span>
                        ))
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Compounds */}
                {item.compounds.length > 0 && (
                  <div>
                    <p className="text-xs text-ink-faint uppercase mb-2">Compounds</p>
                    <div className="space-y-1 text-sm">
                      {item.compounds.slice(0, 2).map((c) => (
                        <p key={c.word} className="flex items-baseline gap-2">
                          <span className="font-serif text-lg text-deep-indigo">{c.word}</span>
                          <span className="text-ink-light">({c.reading})</span>
                          <span className="text-ink-medium">{c.meaning}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mnemonic */}
                <div className="bg-crimson/5 border border-crimson/15 rounded-lg p-3">
                  <p className="text-sm text-ink-dark italic">{item.mnemonic}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Buttons */}
      <div
        className={`
          grid grid-cols-4 gap-2
          transition-all duration-300
          ${flipped && !isFlipping ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}
        `}
      >
        {(Object.keys(RATING_CONFIG) as Rating[]).map((rating) => {
          const config = RATING_CONFIG[rating];
          return (
            <button
              key={rating}
              onClick={() => handleRate(rating)}
              disabled={isFlipping}
              className={`
                py-3 px-2 rounded-xl text-sm font-semibold
                transition-all duration-200 btn-transition
                ${config.bg} ${config.text}
                disabled:opacity-50
              `}
            >
              {config.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
