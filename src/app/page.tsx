"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const CONTEXTS = [
  { value: "", label: "一般", english: "General" },
  { value: "manga", label: "漫画", english: "Manga" },
  { value: "textbook", label: "教科書", english: "Textbook" },
  { value: "sign", label: "看板", english: "Sign" },
  { value: "news", label: "新聞", english: "News" },
];

export default function Home() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);
      if (context) formData.append("context", context);

      const res = await fetch("/api/scan", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Scan failed");

      router.push(`/scan/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type.startsWith("image/")) {
      setFile(droppedFile);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  return (
    <div className="animate-fade-in space-y-10">
      {/* Header — deep indigo color block with gold accent */}
      <header className="text-center space-y-4">
        <div className="inline-block">
          <h1 className="font-serif text-6xl font-bold tracking-tight text-deep-indigo">
            漢字レンズ
          </h1>
          <div className="mt-2 mx-auto h-1 w-24 rounded-full bg-gold animate-brush" />
        </div>
        <p className="text-lg text-ink-medium">
          Upload an image to discover and learn kanji
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Drop Zone — ukiyo-e bordered frame */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative cursor-pointer rounded-2xl
            transition-all duration-300 ease-out
            pattern-diamond overflow-hidden
            ${dragOver
              ? "border-2 border-crimson bg-crimson/5 scale-[1.02] shadow-ukiyo"
              : file
                ? "border-ukiyo p-1"
                : "border-2 border-dashed border-parchment hover:border-gold hover:shadow-gold"
            }
            ${file ? "" : "p-12"}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />

          {file ? (
            <div className="relative z-10 space-y-3 p-3">
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="max-h-64 mx-auto rounded-xl shadow-ukiyo"
              />
              <p className="text-center text-sm text-ink-medium">
                {file.name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="ml-2 text-crimson hover:underline font-medium"
                >
                  Remove
                </button>
              </p>
            </div>
          ) : (
            <div className="relative z-10 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-indigo-deep/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-indigo-deep"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-ink-dark font-medium text-lg">
                  Drop your image here
                </p>
                <p className="text-sm text-ink-light mt-1">
                  or click to browse
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Context Selector — indigo pill buttons with gold active state */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-ink-medium uppercase tracking-wide">
            Source type
          </label>
          <div className="flex flex-wrap gap-2">
            {CONTEXTS.map((ctx) => (
              <button
                key={ctx.value}
                type="button"
                onClick={() => setContext(ctx.value)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium
                  transition-all duration-200 btn-transition
                  ${context === ctx.value
                    ? "bg-indigo-deep text-paper shadow-ukiyo"
                    : "bg-paper-light text-ink-medium border border-parchment hover:border-gold hover:text-gold"
                  }
                `}
              >
                <span className="mr-1.5">{ctx.label}</span>
                <span className="text-xs opacity-60">{ctx.english}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="animate-fade-in-scale p-4 rounded-xl bg-crimson/10 border border-crimson/20">
            <p className="text-crimson text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Submit Button — crimson with gold shimmer */}
        <button
          type="submit"
          disabled={!file || loading}
          className={`
            w-full py-4 px-6 rounded-xl font-medium text-lg
            transition-all duration-200 btn-transition
            ${!file || loading
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
              Scanning...
            </span>
          ) : (
            <span className="relative z-10">Scan Image</span>
          )}
        </button>
      </form>

      {/* Footer hint */}
      <p className="text-center text-sm text-ink-faint">
        Works best with clear text on manga, textbooks, signs, and articles
      </p>
    </div>
  );
}
