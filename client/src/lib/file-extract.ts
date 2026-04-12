/**
 * Server-side file text extraction.
 * Called only from API routes (Node.js runtime) — never imported client-side.
 */

/**
 * Extracts plain text from a base64-encoded file.
 * Supports: PDF, DOCX, and any text/* type.
 */
export async function extractText(
  dataUrl: string,
  mimeType: string,
  name: string,
): Promise<string> {
  const base64 = dataUrl.split(',')[1] ?? dataUrl;
  const buffer = Buffer.from(base64, 'base64');

  // Plain text / markdown
  if (mimeType.startsWith('text/') || mimeType === 'application/json') {
    return buffer.toString('utf-8');
  }

  // PDF 
  if (mimeType === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
    try {
      // pdf-parse must be required (not imported) to avoid Next.js edge issues
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      const result = await pdfParse(buffer);
      const text = result.text?.trim();
      if (!text) return `[PDF: ${name} — no extractable text (likely scanned image)]`;
      return text;
    } catch (err) {
      console.error(`[file-extract] PDF parse failed for ${name}:`, err);
      return `[PDF: ${name} — extraction failed]`;
    }
  }

  // DOCX
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.toLowerCase().endsWith('.docx')
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value?.trim();
      if (!text) return `[DOCX: ${name} — no extractable text]`;
      return text;
    } catch (err) {
      console.error(`[file-extract] DOCX parse failed for ${name}:`, err);
      return `[DOCX: ${name} — extraction failed]`;
    }
  }

  return `[Unsupported file type: ${name} (${mimeType})]`;
}

/**
 * Formats extracted text for injection into a prompt.
 * Truncates to ~8,000 tokens worth of characters to stay within context limits.
 */
export function formatDocContext(
  files: { name: string; text: string }[],
  maxCharsPerFile = 12_000,
): string {
  return files
    .map((f) => {
      const truncated =
        f.text.length > maxCharsPerFile
          ? f.text.slice(0, maxCharsPerFile) + `\n\n[…truncated — ${f.text.length} total chars]`
          : f.text;
      return `--- [Document: ${f.name}] ---\n${truncated}`;
    })
    .join('\n\n');
}
