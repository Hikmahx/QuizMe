# 🧠 QuizMe — AI-Powered Document Learning Platform

QuizMe is an AI-powered web application that transforms documents into interactive learning experiences. Users can upload one or more documents and instantly generate summaries, ask questions, and take AI-generated quizzes to deepen their understanding.

This project is designed as an **AI Engineer portfolio project**, showcasing real-world applications of **LLMs, Retrieval-Augmented Generation (RAG), and AI agent workflows**.

---

# 🚀 Features (MVP)

### 📄 1. View Summary

* Upload a document (PDF)
* Generate:

  * Short summary
  * Medium summary
  * Long summary
* Option for:

  * Combined summary (multi-doc)
  * Per-document summary

---

### ❓ 2. Ask Questions

* Ask questions about uploaded document(s)
* AI answers based on document context

---

### 🧠 3. Quiz Time!

* Automatically generate quizzes from documents:

  * Multiple Choice Questions (MCQs)
  * Theory questions

* Answer modes:
  * ✍️ Written responses
  * 🎤 Voice responses (speech input via Web Speech API)

* 🔊 Read Aloud Toggle:
  * Questions and AI feedback can be read aloud using the browser's built-in Text-to-Speech engine
  * Toggle button to start/stop audio at any time
  * Fully client-side — no backend required

* AI evaluates:

  * User answers
  * Score
  * Feedback & improvement tips

* (Advanced (todo later on) - Voice Analysis):
  * Detect fluency (pauses, filler words)
  * Analyze confidence level
  * Identify speech issues (e.g., stammering patterns)

---

# 🔮 Planned Features (Phase 2+)

* 📌 Key Points Extraction (bullet points / ranked sentences)
* 📊 Document Comparison (similarities & differences)
* 📚 FAQ Generator
* 🧩 DocInsight Mode (all features combined)
* 🎯 Smart Mode (AI agent decides what to do)

---

# 🏗️ Tech Stack

## Frontend

* Next.js (App Router)
* Tailwind CSS
* React Hooks
* Web Speech API (Text-to-Speech + Speech Recognition — built into modern browsers)

## Backend

* Django
* Django REST Framework

## AI / ML

* Hugging Face Transformers
* pdfplumber (PDF text extraction)
* nltk (text processing)

---

# 🧠 AI Concepts Implemented

## 🔍 Retrieval-Augmented Generation (RAG)

Retrieval-Augmented Generation

* Documents are split into chunks
* Stored as embeddings in a vector database
* Relevant chunks are retrieved during queries
* LLM generates answers grounded in document context

---

## 🔊 Voice Interaction (Web Speech API)

* **Text-to-Speech**: Quiz questions and AI-generated feedback can be read aloud using the browser's `SpeechSynthesis` API — no third-party service or backend call required
* **Speech-to-Text**: Users can answer quiz questions by voice using the browser's `SpeechRecognition` API; the transcript is sent to Django for AI evaluation just like a typed answer
* Voice interaction is **100% frontend** — Django only receives and processes the final text

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

AI agent

* Dynamically decide workflow:

  * Summarize
  * Generate quiz
  * Extract insights
* Adapts based on user intent

---

## 🔗 Model Context Protocol (MCP) (Advanced)

Model Context Protocol

* Structured tool-based interaction layer
* Enables LLM to:

  * Access document tools
  * Maintain context
  * Chain operations

---

# 🏛️ Architecture

```text
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

# 🔄 Application Flow

1. User selects feature (Summary, Q&A, Quiz)
2. Uploads document(s)
3. Backend:

   * Extracts text from PDF
   * Processes based on selected feature
4. AI generates:

   * Summary / Answers / Quiz
5. Results returned to frontend and displayed
6. (Quiz) User answers via text or voice; AI evaluates and returns feedback
7. (Quiz) Read Aloud toggle lets the user hear questions and feedback

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
  /quiz
  /summary
  /qa
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

---

## 2. Backend Setup (Django)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
python manage.py runserver
```

---

## 3. Frontend Setup (Next.js)

```bash
cd frontend
npm install
npm run dev
```

---

# 🔌 API Endpoints (Sample)

| Endpoint          | Description               |
| ----------------- | ------------------------- |
| `/api/summary/`   | Generate document summary |
| `/api/questions/` | Answer user questions     |
| `/api/quiz/`      | Generate quiz             |

---

# 📸 UI Design

* Inspired by Frontend Mentor Quiz App
* Dark themed interface
* Clean, minimal, interactive UI
* Read Aloud toggle button on each quiz question

---

# 💼 Portfolio Value

This project demonstrates:

* Full-stack development (Next.js + Django)
* Real-world AI system design
* LLM integration
* RAG pipeline implementation
* Voice-enabled UI
* Scalable architecture
* User-focused AI experience

---

# 🧠 What I Learned

* How to integrate LLMs into production-ready apps
* Handling large documents with chunking
* Building RAG pipelines
* Designing AI-powered user workflows
* Connecting frontend with ML backend
* Implementing voice I/O

---

# 🔥 Future Improvements

* Add authentication (Supabase/Auth)
* Store user history & quiz scores
* Streaming AI responses
* Advanced voice analysis (fluency, confidence, filler word detection)
* Deploy with Docker + cloud (AWS/GCP)

---

# 👤 Author

Hikmah Yousuph
Full-Stack Developer transitioning into AI Engineering

---

# ⭐ Final Note

QuizMe is more than a project — it's a step toward building intelligent systems that make learning faster, smarter, and more interactive using AI.
