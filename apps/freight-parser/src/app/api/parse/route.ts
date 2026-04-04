import { NextRequest, NextResponse } from 'next/server';
import { extractFields } from '@/lib/parser';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
    const data = await pdfParse(buffer);
    return data.text as string;
  } catch {
    return '';
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const contentType = req.headers.get('content-type') ?? '';

    // ── JSON body (paste text) ────────────────────────────────────────────────
    if (contentType.includes('application/json')) {
      const body = (await req.json()) as { text?: string };
      const text = body.text?.trim() ?? '';
      if (!text) {
        return NextResponse.json({ error: 'No text provided' }, { status: 400 });
      }
      const fields = extractFields(text);
      return NextResponse.json({ fields, rawText: text });
    }

    // ── Multipart form data (file upload) ─────────────────────────────────────
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');

      if (!file || typeof file === 'string') {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      const blob = file as File;
      if (blob.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File exceeds 10MB limit' }, { status: 413 });
      }

      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = blob.type;

      let rawText = '';

      if (mimeType === 'application/pdf') {
        rawText = await extractTextFromPDF(buffer);
        if (!rawText.trim()) {
          return NextResponse.json(
            { error: 'Could not extract text from PDF. The file may be scanned/image-based. Try copying and pasting the text instead.' },
            { status: 422 }
          );
        }
      } else if (mimeType.startsWith('image/')) {
        // For images in v1, we return a helpful message
        return NextResponse.json(
          {
            error: 'Image OCR is not supported in v1. Please copy and paste the text from the document instead, or upload a PDF.',
            fields: [],
            rawText: `[Image file: ${blob.name}]`,
          },
          { status: 422 }
        );
      } else {
        return NextResponse.json(
          { error: `Unsupported file type: ${mimeType}` },
          { status: 400 }
        );
      }

      const fields = extractFields(rawText);
      return NextResponse.json({ fields, rawText });
    }

    return NextResponse.json(
      { error: 'Unsupported content type. Use multipart/form-data for file upload or application/json for text.' },
      { status: 415 }
    );
  } catch (err) {
    console.error('[parse] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
