/**
 * Renders a summary as a shareable PNG using Canvas.
 *
 * Unlike email (see mail_service.py's comments on this), a browser CAN load
 * real web fonts for canvas rendering — so this actually tries to load Rubik
 * before drawing, falling back to a system font stack if that fails or times out.
 */

const WIDTH = 1080;
const PADDING = 64;
const CARD_RADIUS = 32;

const COLORS = {
  bg: '#313e51',
  card: '#3b4d66',
  text: '#ffffff',
  textSecondary: '#abc1e1',
  primary: '#a729f5',
};

const FONT_STACK = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export const IMAGE_WORD_LIMIT = 150;

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function truncateToWords(text: string, limit: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= limit) return text.trim();
  return words.slice(0, limit).join(' ') + '…';
}

async function loadRubik(): Promise<string> {
  try {
    const font = new FontFace(
      'Rubik',
      "url(https://fonts.gstatic.com/s/rubik/v28/iJWKBXyIfDnIV7nMrXyi0A.woff2)",
      { weight: '400 700' },
    );
    await Promise.race([
      font.load().then((loaded) => {
        (document.fonts as FontFaceSet).add(loaded);
      }),
      new Promise((_, reject) => setTimeout(reject, 1500)), // don't block forever
    ]);
    return `'Rubik', ${FONT_STACK}`;
  } catch {
    return FONT_STACK; // Rubik unavailable — system stack still looks fine
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (ctx.measureText(attempt).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export interface GenerateImageOptions {
  docName: string;
  summary: string; // already truncated by the caller if needed
}

/**
 * Draws the summary onto a canvas and returns a PNG data URL.
 * Canvas height is computed dynamically from the wrapped text length.
 */
export async function generateSummaryImage({
  docName,
  summary,
}: GenerateImageOptions): Promise<string> {
  const fontFamily = await loadRubik();

  // --- Layout constants (shared by measure + draw passes) ---
  const bodyFontSize = 30;
  const lineHeight = bodyFontSize * 1.5;
  const headerHeight = 140;
  const docTitleHeight = 56;
  const cardPadding = 48;
  const accentBarWidth = 6;
  const accentGap = 22;
  const footerHeight = 100;

  const cardWidth = WIDTH - PADDING * 2;
  const textLeft = PADDING + cardPadding + accentBarWidth + accentGap;
  const textRight = PADDING + cardWidth - cardPadding; // <-- the missing bit
  const textMaxWidth = textRight - textLeft;

  // Measure pass
  const measureCanvas = document.createElement('canvas');
  const mCtx = measureCanvas.getContext('2d')!;
  mCtx.font = `400 ${bodyFontSize}px ${fontFamily}`;
  const lines = wrapText(mCtx, summary, textMaxWidth);

  const textBlockHeight = lines.length * lineHeight + 40;
  const cardHeight = docTitleHeight + textBlockHeight + cardPadding * 2;
  const height =
    headerHeight + cardHeight + footerHeight + PADDING * 2;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, height);

  // Wordmark
  ctx.fillStyle = COLORS.text;
  ctx.font = `700 36px ${fontFamily}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('QuizMe', PADDING, PADDING + 44);

  // Card
  const cardY = headerHeight;
  roundRect(ctx, PADDING, cardY, cardWidth, cardHeight, CARD_RADIUS);
  ctx.fillStyle = COLORS.card;
  ctx.fill();

  // Doc title
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = `500 24px ${fontFamily}`;
  ctx.fillText(
    docName.length > 60 ? docName.slice(0, 57) + '…' : docName,
    PADDING + cardPadding,
    cardY + cardPadding + 28,
  );

  // Accent bar
  const textBoxY = cardY + cardPadding + docTitleHeight;
  ctx.fillStyle = COLORS.primary;
  ctx.fillRect(PADDING + cardPadding, textBoxY, accentBarWidth, textBlockHeight - 20);

  // Summary text
  ctx.fillStyle = COLORS.text;
  ctx.font = `400 ${bodyFontSize}px ${fontFamily}`;
  let ty = textBoxY + bodyFontSize;
  for (const line of lines) {
    ctx.fillText(line, textLeft, ty);
    ty += lineHeight;
  }

  // Footer
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = `400 22px ${fontFamily}`;
  const footerText = 'Made with QuizMe · turn any document into a quiz or summary';
  const footerWidth = ctx.measureText(footerText).width;
  ctx.fillText(footerText, (WIDTH - footerWidth) / 2, height - PADDING);

  return canvas.toDataURL('image/png');
}
