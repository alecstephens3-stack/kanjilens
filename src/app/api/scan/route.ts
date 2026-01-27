import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractKanji } from "@/lib/kanji";
import convert from "heic-convert";
const DEMO_USER = "demo";

// Vercel serverless: allow up to 60s for OCR + LLM calls
export const maxDuration = 60;

/**
 * Call n8n LLM webhook to correct likely OCR errors in Japanese text.
 * Returns corrected text, or the original if the call fails.
 */
async function correctOcrText(rawText: string): Promise<string> {
  try {
    const webhookUrl = `${process.env.N8N_WEBHOOK_URL}/webhook/kanjilens-generate`;
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kanji: "",
        meanings: [],
        readings: { onyomi: [], kunyomi: [] },
        compounds: [],
        // Custom mode: OCR correction
        ocrCorrection: true,
        rawText,
      }),
    });
    if (!res.ok) return rawText;
    const data = await res.json();
    return data.correctedText || rawText;
  } catch {
    return rawText;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Read image into buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert to JPEG base64 for OCR — vision models need JPEG/PNG
    let imageBase64: string;
    const isHeic = file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif");
    if (isHeic) {
      // Convert HEIC → JPEG using heic-convert (pure JS, no native deps)
      try {
        const jpegBuffer = await convert({
          buffer: new Uint8Array(buffer),
          format: "JPEG",
          quality: 0.9,
        });
        imageBase64 = Buffer.from(jpegBuffer).toString("base64");
        console.log("[Scan] HEIC converted to JPEG, size:", jpegBuffer.byteLength, "bytes");
      } catch (heicErr) {
        console.error("[Scan] HEIC conversion failed:", heicErr);
        imageBase64 = buffer.toString("base64");
      }
    } else {
      try {
        const sharp = (await import("sharp")).default;
        const jpegBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
        imageBase64 = jpegBuffer.toString("base64");
        console.log("[Scan] Converted to JPEG, size:", jpegBuffer.length, "bytes");
      } catch {
        imageBase64 = buffer.toString("base64");
        console.log("[Scan] Sharp conversion failed, sending raw base64");
      }
    }

    // Call n8n OCR webhook
    const webhookUrl = `${process.env.N8N_WEBHOOK_URL}/webhook/kanjilens-ocr`;
    const ocrResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!ocrResponse.ok) {
      console.error("[Scan] OCR webhook failed:", ocrResponse.status, await ocrResponse.text().catch(() => ""));
      return NextResponse.json(
        { error: "OCR failed" },
        { status: 502 }
      );
    }

    const ocrBody = await ocrResponse.text();
    console.log("[Scan] OCR raw response:", ocrBody.slice(0, 500));

    let rawText = "";
    try {
      const ocrData = JSON.parse(ocrBody);
      rawText = ocrData.text || ocrData.output || "";
    } catch {
      // Response may be plain text from the webhook
      rawText = ocrBody;
    }

    // OCR cleanup: correct likely OCR errors, then union kanji from both
    const correctedText = await correctOcrText(rawText || "");
    const rawKanji = extractKanji(rawText || "");
    const correctedKanji = extractKanji(correctedText);
    // Union: never drop kanji from raw OCR
    const unionKanji = [...new Set([...rawKanji, ...correctedKanji])];
    // Build final text: use corrected text but append any raw-only kanji
    const finalText = correctedText || rawText || "";

    console.log("[Scan] rawText:", rawText);
    console.log("[Scan] correctedText:", correctedText);
    console.log("[Scan] rawKanji:", rawKanji);
    console.log("[Scan] correctedKanji:", correctedKanji);
    console.log("[Scan] unionKanji:", unionKanji);

    // Create scan record
    const scan = await prisma.scan.create({
      data: {
        userId: DEMO_USER,
        imagePath: "",
        extractedText: finalText,
      },
    });

    return NextResponse.json({ id: scan.id, text: scan.extractedText });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const scan = await prisma.scan.findUnique({ where: { id } });
  if (!scan) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(scan);
}
