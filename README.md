# 🧠 QuizMe — AI-Powered Document Learning Platform

QuizMe is an AI-powered web application that transforms documents into interactive learning experiences. Users can upload one or more documents and instantly generate summaries, ask questions, and take AI-generated quizzes to deepen their understanding.

This project is designed as an **AI Engineer portfolio project**, showcasing real-world applications of **LLMs, Retrieval-Augmented Generation (RAG), and AI agent workflows**.

---

# 🔄 Application Flow

QuizMe follows a consistent, feature-first flow across all pages:

```
Homepage (pick a feature)
        ↓
Upload documents for [feature]
        ↓
Feature-specific options
        ↓
Results page (with Quiz CTA on every page)
```

Navigation is tracked via a **breadcrumb trail** in the top-left corner, showing the user's current location at a glance:

```
QuizMe  ›  📄 View Summary  ›  Long  ›  Doc-by-doc
```

---

# 🚀 Features (MVP)

---

### 📄 1. View Summary

**Flow:** `Homepage` → `Upload` → `Summary length` → `Summary view` _(multi-doc only)_ → `Summary`

#### Summary length options:

- **Short** — A quick overview
- **Medium** — Key points in a balanced summary
- **Long** — Comprehensive, in-depth breakdown

#### Summary view _(only shown when multiple documents are uploaded)_:

- **Default** - single page summary
- **Combined** — One unified summary across all documents
  - If the AI detects the documents are unrelated, it alerts the user and automatically falls back to Doc-by-doc view
- **Doc-by-doc** — Browse each document's summary separately using ← / → navigation, with the document name shown per page

> For single-document uploads, the summary view step is skipped entirely.
>
> File persistence:
> - Uploaded file metadata is stored in `localStorage` on every step.
> - Refreshing page keeps the current file list, summary length, and summary view selection.
> - "Upload different files" button on `/view-summary` redirects to `/?selected=view-summary/upload`.
>
#### After the summary is generated:

- A **"Quiz yourself on this"** CTA appears at the bottom, taking the user directly into the Quiz flow pre-loaded with their document context

---

### ❓ 2. Ask Questions

**Flow:** `Homepage` → `Upload` → `Q&A interface`

- Ask questions about uploaded document(s)
- AI answers based on document context( via RAG later on)
- **"Quiz yourself"** CTA visible throughout

---

### 🧠 3. Quiz Time!

**Flow:** `Homepage` → `Upload` → `Quiz options` → `Quiz` → `Score & Feedback`

#### Quiz type:

- Multiple Choice Questions (MCQs)
- Theory / open-ended questions

#### Answer modes:

- ✍️ Written responses
- 🎤 Voice responses (speech input via Web Speech API)

#### 🔊 Read Aloud Toggle:

- Questions and AI feedback can be read aloud using the browser's built-in Text-to-Speech engine
- Toggle button to start/stop audio at any time
- Fully client-side — no backend required

#### AI evaluates:

- User answers
- Score
- Feedback & improvement tips

#### Advanced _(planned)_:

- Detect fluency (pauses, filler words)
- Analyze confidence level
- Identify speech issues (e.g., stammering patterns)

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
- React Hooks
- Web Speech API (Text-to-Speech + Speech Recognition — built into modern browsers)

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

# 📁 Project Structure

## Frontend (Next.js)

```bash
/app
  /page.js            # Homepage
  /summary            # Summary page
  /q-and-a            # Q&A page
  /quiz               # Quiz page
/components           # UI components
  /shared
    Breadcrumb.jsx      # Feature path tracker (top-left)
    QuizCTA.jsx         # "Quiz yourself" persistent CTA
    ReadAloudBtn.jsx    # TTS toggle button
    VoiceInput.jsx      # SpeechRecognition input
  /summary
    LengthPicker.jsx
    StylePicker.jsx     # Combined vs Doc-by-doc (multi-doc only)
    DocNavigator.jsx    # ← → navigation with doc name
    SummaryCard.jsx
  /quiz
    QuizCard.jsx
    AnswerOptions.jsx
    ScoreCard.jsx
```

---

## Backend (Django)

```bash
/backend
  /api
    views.py          # AI logic endpoints
    urls.py
  /services
    summarizer.py
    qa.py
    quiz.py
    rag.py
```

---

# ⚙️ Installation & Setup

## 1. Clone the Repository

```bash
git clone https://github.com/hikmahx/quizme.git
cd quizme
```

## 2. Backend Setup (Django)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
python manage.py runserver
```

## 3. Frontend Setup (Next.js)

```bash
cd frontend
npm install
npm run dev
```

---

# 🔌 API Endpoints (Sample)

| Endpoint                 | Description                            |
| ------------------------ | -------------------------------------- |
| `/api/summary/`          | Generate document summary              |
| `/api/summary/combined/` | Generate a combined multi-doc summary  |
| `/api/questions/`        | Answer user questions via RAG          |
| `/api/quiz/`             | Generate quiz questions from documents |
| `/api/quiz/evaluate/`    | Evaluate user answer & return feedback |

---

# 💼 Portfolio Value

This project demonstrates:

- Full-stack development (Next.js + Django)
- Real-world AI system design
- LLM integration
- RAG pipeline implementation
- Voice-enabled UI
- Scalable architecture
- User-focused AI experience

---

# 🧠 What I Learned

- How to integrate LLMs into production-ready apps
- Handling large documents with chunking
- Building RAG pipelines
- Designing cohesive multi-step UX & AI-powered user flows
- Implementing voice I/O

---

# 🔥 Future Improvements

- Add authentication (Supabase / Auth.js)
- Store user history, quiz scores, and generated summaries
- Streaming AI responses for real-time feedback
- Advanced voice analysis (fluency, confidence, filler word detection)
- Deploy with Docker + cloud (AWS / GCP)

---

# 👤 Author

**Hikmah Yousuph**
Full-Stack Developer transitioning into AI Engineering

---

# ⭐ Final Note

QuizMe is more than a project — it's a step toward building intelligent systems that make learning faster, smarter, and more interactive using AI.
