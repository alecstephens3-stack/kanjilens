"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { KanjiWithScore } from "@/lib/kanji";

interface DebugInfo {
  rawOcrText: string;
  extractedKanji: string[];
  knownKanji: string[];
  unknownKanji: string[];
  inDictionary: string[];
  droppedByDict: string[];
}

export default function ScanClient({
  scanId,
  text,
  kanji,
  imagePath,
  debug,
}: {
  scanId: string;
  text: string;
  kanji: KanjiWithScore[];
  imagePath: string;
  debug?: DebugInfo;
}) {
  const router = useRouter();
  const unknownCount = kanji.filter((k) => !k.isKnown).length;
  const [count, setCount] = useState(Math.min(unknownCount || kanji.length, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selected = kanji.slice(0, count);

  async function handleCreatePack() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanId,
          kanjiList: selected.map((k) => k.kanji),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create pack");

      router.push(`/pack/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

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
            Scan Results
          </h1>
        </div>
        {imagePath && (
          <img
            src={imagePath}
            alt="Scanned"
            className="h-16 w-16 object-cover rounded-xl shadow-ukiyo border-ukiyo"
          />
        )}
      </header>

      {/* Extracted Text Card — paper card with gold frame */}
      <section className="animate-slide-up stagger-1">
        <h2 className="text-sm font-medium text-ink-light uppercase tracking-wide mb-3">
          Extracted Text
        </h2>
        <div className="bg-paper-light rounded-2xl shadow-paper border-gold-frame p-6 pattern-asanoha overflow-hidden">
          <pre className="relative z-10 font-sans whitespace-pre-wrap text-ink-dark leading-relaxed">
            {text || "No text extracted"}
          </pre>
        </div>
      </section>

      {kanji.length > 0 && (
        <>
          {/* Kanji Grid */}
          <section className="animate-slide-up stagger-2">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-medium text-ink-light uppercase tracking-wide">
                Kanji Found
              </h2>
              <span className="text-sm text-ink-medium">
                <span className="text-crimson font-semibold">{unknownCount} new</span>
                {" · "}
                <span className="text-forest font-medium">{kanji.length - unknownCount} known</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {kanji.map((k, i) => (
                <span
                  key={k.kanji}
                  className={`
                    animate-fade-in-scale inline-flex items-center gap-1.5
                    px-3 py-2 rounded-xl font-serif text-2xl
                    transition-all duration-200
                    ${i < count
                      ? k.isKnown
                        ? "bg-forest/10 text-forest shadow-paper border border-forest/20"
                        : "bg-crimson/10 text-crimson shadow-paper ring-2 ring-crimson/30"
                      : "bg-parchment text-ink-light"
                    }
                  `}
                  style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                >
                  {k.kanji}
                  <span className="text-xs font-sans opacity-50">×{k.occurrences}</span>
                </span>
              ))}
            </div>
          </section>

          {/* Study Count Slider */}
          <section className="animate-slide-up stagger-3 space-y-4">
            <div className="flex items-baseline justify-between">
              <label className="text-sm font-medium text-ink-medium">
                Kanji to study
              </label>
              <span className="font-serif text-2xl text-crimson font-bold">
                {count}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={kanji.length}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-ink-faint text-center">
              Prioritized by frequency and familiarity
            </p>
          </section>

          {/* Error */}
          {error && (
            <div className="animate-fade-in-scale p-4 rounded-xl bg-crimson/10 border border-crimson/20">
              <p className="text-crimson text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Create Pack Button */}
          <button
            onClick={handleCreatePack}
            disabled={loading}
            className={`
              animate-slide-up stagger-4
              w-full py-4 px-6 rounded-xl font-medium text-lg
              transition-all duration-200 btn-transition
              ${loading
                ? "bg-parchment text-ink-light cursor-not-allowed"
                : "bg-crimson text-white shadow-ukiyo hover:shadow-paper-hover btn-gold"
              }
            `}
          >
            {loading ? (
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating Study Pack...
              </span>
            ) : (
              <span className="relative z-10">Create Study Pack ({count} kanji)</span>
            )}
          </button>
        </>
      )}

      {kanji.length === 0 && text && (
        <div className="text-center py-12">
          <p className="text-ink-light">No kanji found in the extracted text.</p>
          <Link
            href="/"
            className="inline-block mt-4 text-gold hover:text-gold-light hover:underline font-medium"
          >
            Try another image
          </Link>
        </div>
      )}

      {/* Debug Panel */}
      {debug && (
        <details className="animate-slide-up mt-4">
          <summary className="text-xs text-ink-faint cursor-pointer hover:text-ink-medium">
            Debug Info
          </summary>
          <div className="mt-2 bg-indigo-deep/5 rounded-xl p-4 text-xs font-mono space-y-2 overflow-auto border border-indigo-deep/10">
            <p><strong>Extracted kanji ({debug.extractedKanji.length}):</strong> {debug.extractedKanji.join(" ")}</p>
            <p><strong>In dictionary ({debug.inDictionary.length}):</strong> {debug.inDictionary.join(" ")}</p>
            <p><strong>Dropped (not in dict) ({debug.droppedByDict.length}):</strong> {debug.droppedByDict.join(" ") || "none"}</p>
            <p><strong>Known ({debug.knownKanji.length}):</strong> {debug.knownKanji.join(" ") || "none"}</p>
            <p><strong>Unknown ({debug.unknownKanji.length}):</strong> {debug.unknownKanji.join(" ") || "none"}</p>
          </div>
        </details>
      )}
    </div>
  );
}
