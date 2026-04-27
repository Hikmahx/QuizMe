import Groq from 'groq-sdk';
import { extractText, formatDocContext } from '@/lib/file-extract';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

type QAMode = 'default' | 'resume' | 'compare' | 'glossary';

const PROMPTS: Record<QAMode, string> = {
  default: `Return exactly: {"mismatch":false}`,

  resume: `You are analysing documents to check if they suit Resume Mode (resume + job description pair).

Return ONLY valid JSON — no markdown, no explanation:
{
  "mismatch": false,
  "analysisSteps": [
    {"id":"1","icon":"document-text-outline","label":"Reading resume","detail":"<real detail from the doc>","status":"done"},
    {"id":"2","icon":"briefcase-outline","label":"Reading job description","detail":"<real detail>","status":"done"},
    {"id":"3","icon":"analytics-outline","label":"Skill gap analysis","detail":"<N matching, M missing skills>","status":"done"},
    {"id":"4","icon":"create-outline","label":"Resume suggestions","detail":"<top 2–3 specific suggestions>","status":"done"},
    {"id":"5","icon":"mail-outline","label":"Cover letter ready","detail":"Generate on request","status":"done"}
  ]
}

Fill detail fields with content grounded in the actual documents.
If docs are clearly NOT a resume/JD (fiction, news, medical, academic): {"mismatch":true,"suggestions":["default","compare","glossary"]}`,

  compare: `You are analysing documents for Compare Mode.

Return ONLY valid JSON — no markdown, no explanation:
{
  "mismatch": false,
  "compareRows": [
    {"aspect":"Main topic","values":["<doc1 value>","<doc2 value>"]},
    {"aspect":"Key arguments","values":["<doc1>","<doc2>"]},
    {"aspect":"Target audience","values":["<doc1>","<doc2>"]},
    {"aspect":"Writing style","values":["<doc1>","<doc2>"]},
    {"aspect":"Length / scope","values":["<doc1>","<doc2>"]},
    {"aspect":"Conclusion","values":["<doc1>","<doc2>"]}
  ]
}

Base every value on actual document content. If only one document uploaded: {"mismatch":true,"suggestions":["default","glossary"]}`,

  glossary: `You are extracting technical terminology from documents.

Return ONLY valid JSON — no markdown, no explanation:
{
  "mismatch": false,
  "glossaryEntries": [
    {"term":"<Term>","definition":"<Clear concise definition based on document context.>"}
  ]
}

Extract 10–40 terms sorted alphabetically. Only domain-specific or technical terms.
If no meaningful technical terminology exists: {"mismatch":true,"suggestions":["default","compare"]}`,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode, files } = body as {
      mode: QAMode;
      files: { name: string; dataUrl: string; type: string }[];
    };

    if (mode === 'default') {
      return Response.json({ mismatch: false });
    }

    // Extract text from every file (PDF, DOCX, TXT all handled)
    const extracted = await Promise.all(
      files.map(async (f) => ({
        name: f.name,
        text: await extractText(f.dataUrl, f.type, f.name),
      })),
    );
    const docContext = formatDocContext(extracted);

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `${PROMPTS[mode]}\n\nReturn ONLY valid JSON. No markdown fences, no explanation, no preamble.`,
        },
        {
          role: 'user',
          content: `Here are the uploaded documents:\n\n${docContext}\n\n---\nAnalyse and return the JSON now.`,
        },
      ],
      max_tokens: 2048,
      temperature: 0.2,
    });

    const text = response.choices[0]?.message?.content ?? '{}';
    const jsonStr = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    const data = JSON.parse(jsonStr);

    return Response.json(data);
  } catch (err) {
    console.error('[/api/analyze]', err);
    return Response.json({ mismatch: false });
  }
}
