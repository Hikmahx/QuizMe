# 🧠 QuizMe — AI-Powered Document Learning Platform

QuizMe is an AI-powered web application that transforms documents into interactive learning experiences. Users upload one or more documents and instantly generate summaries, ask questions across four intelligent modes, and take AI-generated quizzes to deepen their understanding.

---

## 🔄 Application Flow

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

## 🚀 Features

---

### 📤 Document Upload — Shared Across All Features

**Step 1 of 3** for every feature. Supports two input methods:

#### Upload a file

- Drag-and-drop or file browser
- Accepted: **PDF · DOCX · TXT** — up to 20 MB each, up to 10 documents per session
- File metadata + base64 `dataUrl` stored in `localStorage` under `quizme:summary-flow`

#### Paste text

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

### 📄 1. View Summary

**Flow:** `Upload (Step 1)` → `Options (Step 2)` → `Summary (Step 3)`

#### Summary length: Short · Medium · Long

#### Summary view _(only shown when multiple documents are uploaded)_:

- **Default** - single page summary
- **Combined** — One unified summary across all documents
  - If the AI detects the documents are unrelated, it alerts the user and automatically falls back to Doc-by-doc view
- **Doc-by-doc** — Browse each document's summary separately using ← / → navigation, with the document name shown per page
- Quiz CTA in left column after result
- "Use different files" button clears state and returns to upload

---

### ❓ 2. Ask Questions

**Flow:** `Upload (Step 1)` → `Choose Mode (Step 2)` → `Chat (Step 3)`

#### Mode Selection:

- **Default Q&A** - Ask anything grounded in document content
- **Resume Mode** - Skill gap analysis, resume rewrites, cover letter drafts
- **Compare Mode** - Side-by-side structured breakdown of 2+ documents
- **Glossary Mode** - Extract and define all technical terms

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

### 🧠 3. Quiz Time!

**Flow:** `Upload (Step 1)` → `Options (Step 2)` → `Ready → Play → Score → Feedback`

#### Quiz setup options:

- **Difficulty** — Easy · Medium · Hard
- **Number of questions** — 10 · 20 · 30
- **Question type:**
  - **MCQ** — pick the correct answer from four options
  - **Theory** — open-ended; triggers one more step
- **Answer mode** _(theory only)_:
  - **Written** — type your answer
  - **Oral** — speak your answer; AI reads the question aloud first

> All selections are persisted in `localStorage` under `quizme:quiz-flow` via `hooks/useQuizFlow.ts`. Refreshing the page restores all choices.

#### "Are you ready?" page (`/quiz/ready`):

- Summary card of all chosen settings
- **Start Quiz** button and metadata line sit _below_ the card
- "Change settings" link returns to the first setup step
- Oral-mode users see a tip panel explaining the Record / Stop flow

#### Answer modes:

- **MCQ** — four `A / B / C / D` answer cards.
- **Written** — written answer input
- **Oral** — waveform panel (20 animated bars) + manual Record / Stop buttons. See oral flow below

#### Oral answer flow:

1. AI reads the question aloud — words underlined one-by-one on the left
2. **"Tap Record when you're ready"** prompt — user controls when to start
3. User taps **Start Recording** → mic opens, live green bars animate, pulsing red dot + `MM:SS` timer shown
4. User taps **Stop Recording** (or 60 s safety timeout fires) → "Analysing your response…" spinner (1.5 s)
5. Full transcript revealed — user reviews it
6. **Retry button** in the transcript card — clears the recording and resets to step 2 so the user can re-record as many times as needed
7. If no speech detected — a **Try Again** button is shown prominently

```
SpeechSynthesis reads question → words underlined → phase: 'ready'
        ↓ [user taps Start Recording]
getUserMedia → live waveform · SpeechRecognition (continuous, finals only)
        ↓ [user taps Stop Recording]
phase: 'analysing' (1.5 s) → transcript shown → Next activates
        ↓ [optional: Retry]
transcript cleared → phase: 'ready' → user records again
        ↓
POST /api/quiz/evaluate/ → AI grades transcript
```

> ⚠️ `SpeechRecognition` works best on Chrome / Edge. Firefox support is limited.

#### Score page (`/quiz/score`):

- **Left:** "Quiz completed / You scored…" with accuracy breakdown
- **Right:** score card (feature icon + large score number + "out of N") · View Feedback · Play Again


> File persistence: quiz flow options are stored in `localStorage` and cleared on Play Again.

#### AI evaluates :

- User answers
- Score
- Feedback & improvement tips

#### Advanced _(for later)_:

- Detect fluency (pauses, filler words)
- Analyze confidence level
- Identify speech issues (e.g., stammering patterns)

#### After the quiz is complete:

- Play Again restarts from `/quiz/options?step=difficulty`
- View Feedback takes the user to `/quiz/feedback` for a full per-question breakdown

---

### 🔁 Quiz CTA — Appears on Every Feature Page

The **"Quiz yourself"** button is a persistent feature across all pages — not just the Quiz page. After viewing a summary, getting Q&A answers, or using any future feature, the user is always one tap away from testing their knowledge. This reinforces QuizMe's core purpose: turning passive reading into active learning.

---

# 🔮 Planned Features (Phase 2+)

- 📌 **Key Points Extraction** — Bullet points or ranked sentences by importance
- 📊 **Document Comparison** — Similarities and differences across docs
- 📚 **FAQ Generator** — Auto-generate common questions from the document
- 🧩 **DocInsight Mode** — Upload + Summary + Q&A + Key Points in one flow
- 🎯 **Smart Mode** — AI agent decides what to do based on user intent

---

# 🏗️ Tech Stack

## Frontend

- Next.js (App Router)
- Tailwind CSS
- TypeScript
- Web Speech API (TTS + STT)
-  `pdf-parse` (PDF), `mammoth` (DOCX - server-side)

## Backend

- FastAPI

## AI / ML

- Groq (`llama-3.3-70b-versatile`) via `groq-sdk`   
- Hugging Face Transformers
- pdfplumber (PDF text extraction)
- nltk (text processing)
- Pydantic
- CrewAI (for AI Agents)
- Langchain (for RAG)
- 

---

# 🧠 AI Concepts Implemented

## 🔍 Retrieval-Augmented Generation (RAG)

- Documents are split into chunks
- Stored as embeddings in a vector database
- Relevant chunks are retrieved during queries
- LLM generates answers grounded in document context

---

## 🔊 Voice Interaction (Web Speech API)

- **Text-to-Speech**: Quiz questions and AI-generated feedback can be read aloud using the browser's `SpeechSynthesis` API — no third-party service or backend call required
- **Speech-to-Text**: Users can answer quiz questions by voice using the browser's `SpeechRecognition` API; the transcript is sent to FastAPI for AI evaluation just like a typed answer
- Voice interaction is **100% frontend** — FastAPI only receives and processes the final text

```
Browser mic → SpeechRecognition API → transcript text
                                              ↓
                                    POST /api/quiz/evaluate/  ← FastAPI grades it
                                              ↓
                                    Result text → SpeechSynthesis reads feedback aloud
```

> ⚠️ **Note:** The `SpeechRecognition` API works best on Chromium-based browsers (Chrome, Edge). Firefox support is limited.

---

## 🤖 AI Agents (Planned)

- Dynamically decide workflow:
  - Summarize
  - Generate quiz
  - Extract insights

- Adapts based on user intent

---

## 🔗 Model Context Protocol (MCP) (Advanced)

- Structured tool-based interaction layer
- Enables LLM to:
  - Access document tools
  - Maintain context
  - Chain operations

---

# 🏛️ Architecture

```
Next.js (Frontend UI)
        ↓
Next.js API routes (temporary Groq integration)
      ↓  ← swap fetch URLs in hooks/useQAFlow.ts when ready
FastAPI REST API
      ↓
RAG + Agent + MCP Layer
      ↓
LLM (Groq / HuggingFace)
```

---

# 📸 UI Design

- Consistent two-column layout across all pages (context left, action right)
- Breadcrumb navigation in the top-left showing full feature path: [icon] [feature] > [page].
- "Quiz yourself" CTA card visible after every feature's result

---

# ⚙️ Setup

```bash
git clone https://github.com/hikmahx/quizme.git
cd quizme/client
npm install
# create client/.env.local and add:
# GROQ_API_KEY=your_key_here
npm run dev
```

---

## 👤 Author

**Hikmah Yousuph** — Full-Stack Developer transitioning into AI Engineering
