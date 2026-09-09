# KanjiLens

Learn kanji from photos. Upload an image of Japanese text, and KanjiLens extracts the kanji, prioritizes the ones you don't know yet, and generates AI-powered study packs with mnemonics, compounds, and example sentences. Review with SRS flashcards.

## Features

- **Photo-based kanji extraction** — Upload photos of signs, manga, textbooks, or any Japanese text
- **AI-powered OCR** — Vision models extract and correct Japanese text via n8n + OpenRouter
- **Smart prioritization** — Unknown kanji ranked by frequency and familiarity
- **AI study packs** — Generated mnemonics, example sentences, compounds, and confusable kanji warnings
- **SRS flashcard review** — Spaced repetition for long-term retention
- **HEIC support** — iPhone photos auto-converted to JPEG
- **2,000+ kanji dictionary** — Built-in readings, meanings, and compounds

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4 with ukiyo-e inspired theme
- **Database:** PostgreSQL via Prisma ORM
- **AI Pipeline:** n8n webhooks + OpenRouter (vision model for OCR, LLM for study content)
- **Image Processing:** heic-convert for HEIC/HEIF support

## Prerequisites

- Node.js 20+
- PostgreSQL 16 (or use the included Docker Compose)
- An [n8n](https://n8n.io) instance with the KanjiLens workflows
- An [OpenRouter](https://openrouter.ai) API key

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/alecstephens3-stack/kanjilens.git
cd kanjilens
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

Or connect to an existing PostgreSQL instance.

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (default works with Docker Compose) |
| `N8N_WEBHOOK_URL` | Base URL of your n8n instance |
| `OPENROUTER_API_KEY` | Your OpenRouter API key |
| `DEMO_USER_ID` | User ID for the demo user (default: `demo`) |

### 4. Set up the database

```bash
npm install
npx prisma migrate dev
npm run db:seed
```

### 5. Set up n8n workflows

The app expects two webhook endpoints on your n8n instance:

**OCR Webhook** — `POST /webhook/kanjilens-ocr`
- Input: `{ imageBase64: string }` (base64-encoded JPEG)
- Processing: Sends image to an OpenRouter vision model for Japanese text extraction
- Output: `{ text: string }`

**Study Content Webhook** — `POST /webhook/kanjilens-generate`
- Input: `{ kanji, meanings, readings, compounds }` for study content generation, or `{ ocrCorrection: true, rawText }` for OCR error correction
- Processing: Calls OpenRouter LLM to generate mnemonics, examples, confusable warnings
- Output: `{ mnemonic, examples, confusable }` or `{ correctedText }`

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

1. **Upload** — User uploads a photo containing Japanese text
2. **OCR** — Image is sent to n8n webhook, which uses a vision model to extract text
3. **Correction** — Extracted text goes through LLM-based OCR error correction
4. **Extraction** — Kanji are extracted from corrected text using Unicode regex
5. **Prioritization** — Kanji ranked: unknown first, then by frequency and SRS history
6. **Study Pack** — Each kanji gets AI-generated mnemonics, examples, and confusable warnings
7. **Review** — Flashcard interface with SRS rating (Again/Hard/Good/Easy)

## Project Structure

```
kanjilens/
├── prisma/                # Database schema and migrations
├── src/
│   ├── app/
│   │   ├── api/           # API routes (scan, pack, review)
│   │   ├── scan/[id]/     # Scan results page
│   │   ├── pack/[id]/     # Study pack page
│   │   ├── review/[id]/   # Flashcard review page
│   │   ├── globals.css    # Ukiyo-e theme
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Home (image upload)
│   ├── data/
│   │   └── kanji-dict.json    # Kanji dictionary
│   ├── lib/               # Shared utilities
│   │   ├── db.ts          # Prisma client
│   │   ├── dictionary.ts  # Dictionary lookup
│   │   ├── kanji.ts       # Kanji extraction + prioritization
│   │   └── srs.ts         # Spaced repetition algorithm
│   └── types/             # TypeScript declarations
└── docker-compose.yml     # PostgreSQL for local dev
```

## Contributing

Contributions are welcome. Please open an issue to discuss changes before submitting a PR.

## License

MIT
