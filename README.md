# 🧠 QuizMe — AI-Powered Document Learning Platform

QuizMe is an AI-powered web application that transforms documents into interactive learning experiences. Users can upload one or more documents and instantly generate summaries, ask questions, and take AI-generated quizzes to deepen their understanding.

---

# 🔄 Application Flow

```
Homepage (pick a feature)
        ↓
Upload documents for [feature]   ← /?selected=[feature]/upload
        ↓
Feature-specific options
        ↓
Results page (with Quiz CTA on every page)
```

Breadcrumb trail example:
```
Quiz Time!  ›  MCQ
View Summary  ›  Long  ›  Doc-by-doc
```


# 🚀 Features (MVP)

---

### 📄 1. View Summary

**Flow:** `Homepage` → `Upload` → `Summary length` → `Summary view` _(multi-doc only)_ → `Summary`

#### Summary length: Short · Medium · Long

#### Summary view _(only shown when multiple documents are uploaded)_:

- **Default** - single page summary
- **Combined** — One unified summary across all documents
  - If the AI detects the documents are unrelated, it alerts the user and automatically falls back to Doc-by-doc view
- **Doc-by-doc** — Browse each document's summary separately using ← / → navigation, with the document name shown per page


#### File persistence
File metadata + base64 `dataUrl` stored in `localStorage` under `quizme:summary-flow`. Refreshing restores all state. Managed by `lib/storage.ts` + `hooks/useSummaryFlow.ts`.

#### "Use different files" button
On `/view-summary`, clears `localStorage` and redirects to `/?selected=view-summary/upload`.

#### After summary: Quiz CTA
A "Quiz yourself on this" button in the left column routes to `/?selected=quiz-time/upload`.

---

### ❓ 2. Ask Questions

**Flow:** `Homepage` → `Upload` → `Q&A`

- Ask questions about uploaded document(s)
- AI answers based on document context( via RAG later on)
- **"Quiz yourself"** CTA visible throughout

---

### 🧠 3. Quiz Time!

**Flow:** `Homepage` → `Upload` → `Quiz options` → `Quiz` → `Score & Feedback`

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

## Backend

- Django
- Django REST Framework

## AI / ML

- Hugging Face Transformers
- pdfplumber (PDF text extraction)
- nltk (text processing)

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
- **Speech-to-Text**: Users can answer quiz questions by voice using the browser's `SpeechRecognition` API; the transcript is sent to Django for AI evaluation just like a typed answer
- Voice interaction is **100% frontend** — Django only receives and processes the final text

```
Browser mic → SpeechRecognition API → transcript text
                                              ↓
                                    POST /api/quiz/evaluate/  ← Django grades it
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
Django REST API
        ↓
AI Processing Layer
        ↓
RAG System (Embeddings + Vector DB)
        ↓
LLM (HuggingFace / OpenAI)
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
npm run dev
```

---

# 👤 Author

**Hikmah Yousuph** — Full-Stack Developer transitioning into AI Engineering

---

QuizMe is more than a project — it's a step toward building intelligent systems that make learning faster, smarter, and more interactive using AI.
