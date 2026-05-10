# QuizMe — AI-Powered Document Learning Platform

QuizMe is an AI-powered web application that transforms any kind of documents into interactive learning experiences. Users upload one or more documents and instantly generate summaries, ask questions across four intelligent modes, and take AI-generated quizzes to deepen their understanding.

![QuizMe Home](./client/public/readme/quizme.png)

---

## Table of Contents

- [Application Flow](#application-flow)
- [Features](#features)
  - [Document Upload](#document-upload--shared-across-all-features)
  - [1. View Summary](#1-view-summary)
  - [2. Ask Questions](#2-ask-questions)
  - [3. Quiz Time!](#3-quiz-time)
  - [Quiz CTA](#quiz-cta--appears-on-every-feature-page)
- [Planned Features](#planned-features-later)
- [Tech Stack](#tech-stack)
- [AI Concepts Implemented](#ai-concepts-implemented)
- [Architecture](#architecture)
- [UI Design](#ui-design)
- [Setup](#setup)

---

## Application Flow

```
Homepage (pick a feature)
        ↓
Upload documents   ← /?selected=[feature]/upload
        ↓
Feature-specific options (Step 2)
        ↓
Results / Chat page (Step 3)
        ↓
Quiz CTA available on every result page
```

---

## Features

---

### Document Upload — Shared Across All Features

**Step 1 of 3** for every feature. Supports two input methods:

![Upload Step](./client/public/readme/quizme-uploaded.png)

#### Upload a file
- Drag-and-drop or file browser
- Accepted: **PDF · DOCX · TXT** — up to 20 MB each, up to 2 documents per session
- File metadata + base64 `dataUrl` stored in `localStorage` under `quizme:summary-flow`

#### Paste text
![Upload Step](./client/public/readme/quizme-upload.png)

- Available on the initial screen when **no files have been added yet**
- Up to **2,000 words** with live word counter
- Auto-detects file type: content starting with a `#` heading → `.md`, everything else → `.txt`
- Clicking **Save** opens the **File Naming Modal** where the user names the file
- Once a file exists, paste moves into the **Add Another Document modal**

#### File Naming Modal

- 160-character preview of pasted content
- User types a filename; extension badge (`.txt` / `.md`) and hint update automatically
- Confirm with **Save file** or Enter; cancel returns to paste input

#### Add Another Document modal

- Two tabs: **Upload file** (full drop zone) and **Paste text**
- Right panel: file list scrolls; Add / Continue / footnote strip pinned at bottom

#### File list

- Type badge, name, size or `N words · pasted text` for pasted entries, progress bar, × remove

---

### 1. View Summary

**Flow:** `Upload (Step 1)` → `Options (Step 2)` → `Summary (Step 3)`

#### Summary length: Short · Medium · Long

![Summary Length](./client/public/readme/quizme-length.png)

#### Summary view _(only shown when multiple documents are uploaded)_:

- **Default** - single page summary
- **Combined** — One unified summary across all documents
 ![Combined Summary](./client/public/readme/quizme-combined.png) 
  - If the AI detects the documents are unrelated, it alerts the user and automatically falls back to Doc-by-doc view
- **Doc-by-doc** — Browse each document's summary separately using ← / → navigation, with the document name shown per page
  ![Doc-by-doc Summary](./client/public/readme/quizme-doc-by-doc.png)
- Quiz CTA in left column after result
- "Use different files" button clears state and returns to upload
---

### 2. Ask Questions

**Flow:** `Upload (Step 1)` → `Choose Mode (Step 2)` → `Chat (Step 3)`

#### Mode Selection:

![Choose Mode](./client/public/readme/quizme-mode.png)

- **Default Q&A** - Ask anything grounded in document content
- **Resume Mode** - Skill gap analysis, resume rewrites, cover letter drafts![Resume Mode](./client/public/readme/quizme-resume.png)
- **Compare Mode** - Side-by-side structured breakdown of 2+ documents
![Compare Mode](./client/public/readme/quizme-compare.png)
- **Glossary Mode** - Extract and define all technical terms
![Glossary Mode](./client/public/readme/quizme-glossary.png)

#### Chat (`/q-and-a/chat?mode=[mode]`):

**Right — Chat:**

- Streaming AI responses (token-by-token via Groq)
- User bubbles: purple tint · AI bubbles: transparent + avatar
- Mode-change chips and file-change chips in user bubbles
- Mode suggestion badges when AI detects a mismatch
- **Quiz Me CTA** inline at the end of substantive answers
- Quick mode switcher (pill buttons) in chat header
- Fixed input bar; purple send button; Shift+Enter for new line

**Left — Context panel (max 4 screens):**

| Screen               | When shown                                                             |
| -------------------- | ---------------------------------------------------------------------- |
| `InfoPanel`          | Landing screen — default mode or before analysis                       |
| `AgentStepsPanel`    | Resume mode — 5 agent steps with status + detail                       |
| `CompareTablePanel`  | Compare mode — sticky-header table, one column per file                |
| `GlossaryPanel`      | Glossary mode — search + horizontal alphabet bar + collapsible entries |
| `DefaultResultPanel` | Default mode — active file list + tips                                 |

- Screens: landing (always screen 0) + one per non-default mode = max 4 total
- Switching to a mode that already has a screen updates it in place — **no duplicate screens**
- **No loading screen** is ever added to the array — a loading overlay is shown on top of the current screen while the API call runs
- Errors produce a chat message only — no screen changes
- Chevron `‹ ›` navigation + dot indicators when multiple screens exist

**File selector popover:**

- Dropdown with checkboxes — user toggles freely with no side effects
- **Update** button appears only when selection differs from current
- Clicking Update → confirmation modal → on confirm, AI re-analyses the existing mode screen in place

**Mobile:** tab switcher ("💬 Chat" / "📄 Context")

#### Temporary API routes (replaced by FastAPI in production)

| Route               | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `POST /api/chat`    | Streaming Groq chat with mode-aware system prompt                  |
| `POST /api/analyze` | Structured JSON — agent steps / compare rows / glossary / mismatch |

Both use `lib/file-extract.ts`: `pdf-parse` for PDFs, `mammoth` for DOCX, UTF-8 decode for text.
To switch to FastAPI: update the two `fetch('/api/...')` calls in `hooks/useQAFlow.ts`.

**Required env var:** `GROQ_API_KEY=...` in `client/.env.local`

---

### 3. Quiz Time!

**Flow:** `Upload (Step 1)` → `Options (Step 2)` → `Ready → Play → Score → Feedback`

#### Quiz setup options:

- **Difficulty** — Easy · Medium · Hard
- **Number of questions** — 10 · 20 · 30

![Quiz Count](./client/public/readme/quizme-how-many-questions.png)

- **Question type:**
  - **MCQ** — pick the correct answer from four options
  - **Theory** — open-ended; triggers one more step
- **Answer mode** _(theory only)_:
  - **Written** — type your answer
  - **Oral** — speak your answer; AI reads the question aloud first via backend TTS

> All selections are persisted in `localStorage` under `quizme:quiz-flow` via `hooks/useQuizFlow.ts`. Refreshing the page restores all choices.

#### "Are you ready?" page (`/quiz/ready`):

- Summary card of all chosen settings
- **Start Quiz** button and metadata line sit _below_ the card
- "Change settings" link returns to the first setup step
- Oral-mode users see a tip panel explaining the Record / Stop flow

#### AI question generation:

When documents have been uploaded and processed, the Quiz Generator Agent generates questions directly from the document content at the chosen difficulty. If no documents are uploaded, a set of sample questions is used as fallback so the quiz never breaks.

#### Answer modes:

- **MCQ** — four `A / B / C / D` answer cards
- **Written** — written answer input
- **Oral** — waveform panel + manual Record / Stop buttons. See oral flow below.

#### Oral answer flow (Voice RAG Agent):

![Oral Quiz](./client/public/readme/quizme-oral.png)

1. AI reads the question aloud via backend TTS (CartesiaAI or Edge TTS fallback)
2. **"Tap Record when you're ready"** prompt — user controls when to start
3. User taps **Start Recording** → mic opens, live waveform animates, pulsing red dot + `MM:SS` timer shown
4. User taps **Stop Recording** (or 60 s safety timeout fires) → audio sent to backend STT
5. Backend transcribes the audio (AssemblyAI or faster-whisper fallback)
6. Full transcript revealed — user reviews it
7. **Retry button** in the transcript card — clears the recording and resets to step 2 so the user can re-record as many times as needed
8. If no speech detected — a **Try Again** button is shown prominently

```
Backend TTS reads question aloud → phase: 'ready'
        ↓ [user taps Start Recording]
getUserMedia → MediaRecorder captures audio (WebM/Opus)
        ↓ [user taps Stop Recording]
POST /api/voice/stt/ → backend transcribes → transcript shown → Next activates
        ↓ [optional: Retry]
transcript cleared → phase: 'ready' → user records again
        ↓
POST /api/quiz/evaluate/ → AI grades transcript
```

#### Score page (`/quiz/score`):

- **MCQ:** shows real numeric score (e.g. "7 out of 10") calculated client-side from `correctIndex` matching
- **Theory:** shows an "AI grading in progress" card — the Answer Grader Agent runs on the feedback page

#### Feedback page (`/quiz/feedback`):

- All answers are sent to `POST /api/quiz/evaluate/` in one request
- The Answer Grader Agent evaluates each answer against the retrieved document context (RAG-grounded grading)
- **MCQ:** ✓ / ✗ badge per card. `correct` determined client-side; `explanation` and `tip` from the AI.
- **Theory:** percentage badge per card (e.g. `72%`), colour-coded: green ≥80%, amber ≥50%, red <50%. An answer is considered correct at ≥50%.
- Overall score shown in the left panel: `X / N correct` for MCQ, `Overall: N%` for theory
- Cards reveal all at once after grading completes

#### Advanced _(for later)_:

- Detect fluency (pauses, filler words)
- Analyze confidence level
- Identify speech issues (e.g., stammering patterns)

#### After the quiz is complete:

- Play Again restarts from `/quiz/options?step=difficulty`
- View Feedback takes the user to `/quiz/feedback` for a full per-question breakdown

---

### Quiz CTA — Appears on Every Feature Page

The **"Quiz yourself"** button is a persistent feature across all pages — not just the Quiz page. After viewing a summary, getting Q&A answers, or using any future feature, the user is always one tap away from testing their knowledge. This reinforces QuizMe's core purpose: turning passive reading into active learning.

---

# Planned Features (Later)

- **Key Points Extraction** — Bullet points or ranked sentences by importance
- **Document Comparison** — Similarities and differences across docs
- **FAQ Generator** — Auto-generate common questions from the document
- **DocInsight Mode** — Upload + Summary + Q&A + Key Points in one flow
- **Smart Mode** — AI agent decides what to do based on user intent

---

# Tech Stack

## Frontend

- Next.js (App Router)
- Tailwind CSS
- TypeScript
- `pdf-parse` (PDF), `mammoth` (DOCX — server-side, Q&A temp routes only)

## Backend

- FastAPI + Uvicorn
- SQLAlchemy + psycopg2 (PostgreSQL ORM)
- Supabase (hosted PostgreSQL + pgvector)

## AI / ML

- Groq (`llama-3.3-70b-versatile`) — summaries, quiz generation, answer grading
- sentence-transformers (`all-MiniLM-L6-v2`) — local document embeddings
- pgvector — vector similarity search in PostgreSQL
- pdfplumber — PDF text extraction
- python-docx — DOCX text extraction
- langchain-text-splitters — document chunking
- CrewAI — multi-agent orchestration (Quiz Generator Agent + Answer Grader Agent)
- AssemblyAI — cloud speech-to-text (primary STT, free trial)
- faster-whisper — local speech-to-text (STT fallback, no API key needed)
- CartesiaAI — cloud text-to-speech (primary TTS, free trial)
- Edge TTS — local text-to-speech (TTS fallback, no API key needed)

---

# AI Concepts Implemented

## Retrieval-Augmented Generation (RAG)

Documents are split into overlapping chunks using `langchain-text-splitters`, then embedded locally using `sentence-transformers`. Embeddings are stored in Supabase via pgvector. On every query, the most semantically similar chunks are retrieved using cosine distance and passed to the LLM as grounded context.

Collections are cached by a hash of the uploaded file names and sizes — re-uploading the same files skips re-processing entirely. Collections that have not been accessed for 3 days are cleaned up automatically.

```
Upload → extract text → chunk → embed (local) → store in Supabase
Query  → embed query → cosine search → retrieve top-K chunks → LLM
```

## Voice RAG Pipeline

The oral quiz mode runs a full backend voice pipeline — no browser speech APIs are used for STT or TTS.

**Text-to-Speech (TTS):**
- Primary: CartesiaAI (cloud, high quality) — used when `CARTESIA_API_KEY` is set
- Fallback: Edge TTS (local, free) — used automatically if CartesiaAI is unavailable or its trial expires

**Speech-to-Text (STT):**
- Primary: AssemblyAI (cloud, higher accuracy) — used when `ASSEMBLYAI_API_KEY` is set
- Fallback: faster-whisper (local, runs on CPU) — used automatically if AssemblyAI is unavailable or its trial expires

Both services fall back silently — the user never sees an error if the primary service fails.

```
POST /api/voice/speak/      ← text → CartesiaAI or Edge TTS → WAV bytes → browser plays
POST /api/voice/transcribe/ ← audio blob → AssemblyAI or faster-whisper → transcript text
```

## AI Agents (CrewAI)

Phase 3 introduced two CrewAI agents that handle quiz generation and answer grading. Each agent has one focused role, a system prompt defining its persona, and access to retrieved document context as its tool.

**Quiz Generator Agent**
- Retrieves a broad cross-section of document chunks (top-15 by default)
- Instructs Groq to write MCQ or theory questions at the chosen difficulty
- Returns structured JSON matching the frontend's `QuizQuestion` type directly
- `temperature=0.7` — variety in questions

**Answer Grader Agent**
- Retrieves the most relevant document chunk for each specific question
- Grades MCQ answers against the correct option text
- Grades theory answers as a percentage (0–100), rewarding paraphrasing
- Returns `{ correct, score_pct, explanation, tip }` per question
- `temperature=0.1` — consistent scores; same answer always gets the same grade
- If retrieved context is from a different document (stale collection_id), it is discarded and the agent grades using general knowledge instead

```
generate:  retrieve broad chunks → Quiz Generator Agent → JSON questions
evaluate:  retrieve targeted chunk per question → Answer Grader Agent → feedback + score_pct
```

## Model Context Protocol (MCP) _(Planned)_

- Structured tool-based interaction layer
- Enables LLM to:
  - Access document tools
  - Maintain context
  - Chain operations

---

# Architecture

```
Next.js (Frontend UI)
        ↓
Next.js API routes (temporary Groq integration for Q&A)
      ↓  ← swap fetch URLs in hooks/useQAFlow.ts when ready
FastAPI REST API
      ↓
RAG + Agent + MCP Layer
      ↓
LLM (Groq / HuggingFace)
```

---

# UI Design

- Consistent two-column layout across all pages (context left, action right)
- Breadcrumb navigation in the top-left showing full feature path: [icon] [feature] > [page].
- "Quiz yourself" CTA card visible after every feature's result

---

# Setup

## Frontend

```bash
git clone https://github.com/hikmahx/quizme.git
cd quizme/client
npm install
# create client/.env.local and add:
# NEXT_PUBLIC_API_URL=http://localhost:8000
# GROQ_API_KEY=your_key_here   ← only needed for the temporary Q&A API routes
npm run dev
```

## Backend

```bash
cd quizme/fastapi-backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `fastapi-backend/.env`:

```
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
GROQ_API_KEY=your_groq_key

# Optional — leave empty to use local fallbacks
ASSEMBLYAI_API_KEY=
CARTESIA_API_KEY=
```

Run the Supabase SQL setup (once):

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS document_collections (
    id VARCHAR(16) PRIMARY KEY,
    file_fingerprint TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id SERIAL PRIMARY KEY,
    collection_id VARCHAR(16) NOT NULL
        REFERENCES document_collections(id) ON DELETE CASCADE,
    doc_name TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(384),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS document_chunks_collection_idx ON document_chunks(collection_id);
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
    ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

Start the server:

```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`.

---

## Author

**Hikmah Yousuph** — Full-Stack Developer transitioning into AI Engineering
