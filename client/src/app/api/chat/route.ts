import Groq from 'groq-sdk';
import { extractText, formatDocContext } from '@/lib/file-extract';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

type QAMode = 'default' | 'resume' | 'compare' | 'glossary';

function systemPrompt(mode: QAMode, fileNames: string[]): string {
  const files = fileNames.join(', ');
  const base = `You are an AI assistant helping the user understand their uploaded documents: ${files}. Answer concisely and clearly. The full document contents are provided at the start of the conversation.`;
  const quizHint = `\n\nAt the end of any substantive answer (not a one-liner), output the token [QUIZ_CTA] on its own line.`;

  switch (mode) {
    case 'resume':
      return `${base} You are in Resume Mode. Analyse skill gaps between the resume and job description, suggest rewrites, and draft cover letter sections on request. Be specific and actionable.${quizHint}`;
    case 'compare':
      return `${base} You are in Compare Mode. Compare and contrast the documents across relevant dimensions.${quizHint}`;
    case 'glossary':
      return `${base} You are in Glossary Mode. Help define and explain technical terminology from the documents.${quizHint}`;
    default:
      return `${base} Answer questions grounded in the document content.${quizHint}`;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode, files, messages } = body as {
      mode: QAMode;
      files: { name: string; dataUrl: string; type: string }[];
      messages: { role: 'user' | 'assistant'; content: string }[];
    };

    // Extract text from every file (PDF, DOCX, TXT all handled)
    const extracted = await Promise.all(
      files.map(async (f) => ({
        name: f.name,
        text: await extractText(f.dataUrl, f.type, f.name),
      })),
    );
    const docContext = formatDocContext(extracted);

    // Inject document context into the first user message
    const apiMessages = messages.map((m, i) => {
      if (i === 0 && m.role === 'user') {
        return {
          role: 'user' as const,
          content: `Here are the uploaded documents:\n\n${docContext}\n\n---\n\n${m.content}`,
        };
      }
      return { role: m.role as 'user' | 'assistant', content: m.content };
    });

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt(mode, files.map((f) => f.name)) },
        ...apiMessages,
      ],
      stream: true,
      max_tokens: 2048,
      temperature: 0.7,
    });

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) controller.enqueue(new TextEncoder().encode(text));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    console.error('[/api/chat]', err);
    return new Response('Internal server error', { status: 500 });
  }
}
