# 📁 Project Structure

> Frontend only. Backend structure is in `/backend`.

```
client/src/
├── app/
│   ├── page.tsx                         # Homepage + upload step (via ?selected=)
│   ├── view-summary/
│   │   ├── options/page.tsx             # Length + style steps
│   │   └── page.tsx                     # Summary result
│   ├── q-and-a/page.tsx                 # Q&A interface
│   └── quiz/
│       ├── page.tsx                     # Redirects → /quiz/options
│       ├── options/page.tsx             # All 4 setup steps (uses global OptionCard)
│       ├── ready/page.tsx               # "Are you ready?" confirmation
│       ├── play/page.tsx                # 100vh question page (MCQ / Written / Oral)
│       ├── score/page.tsx               # Score results
│       └── feedback/page.tsx            # Per-question AI feedback
│
├── components/
│   ├── global/                          # Shared across all features
│   │   ├── Breadcrumb.tsx               # [icon] Feature › Step › Sub-step
│   │   ├── FeatureIcon.tsx              # Coloured icon box — used in cards + breadcrumb
│   │   ├── Header.tsx                   # Top nav with logo + theme toggle
│   │   ├── InfoList.tsx                 # Purple-dot bullet list (left columns)
│   │   ├── OptionCard.tsx               # Selectable option card — summary AND quiz
│   │   ├── ProgressBar.tsx              # Step progress indicator
│   │   ├── QuizCTA.tsx                  # Persistent "Quiz Me" CTA (compact + full variants)
│   │   ├── StepBadge.tsx                # "Step N of M" pill
│   │   └── TwoColumnLayout.tsx          # Context left, action right — every page
│   │
│   ├── home/
│   │   ├── Feature.tsx                  # Homepage feature selection card
│   │   └── Home.tsx                     # Homepage wrapper
│   │
│   ├── summary/
│   │   ├── DocNavigator.tsx             # ← → doc-by-doc navigation
│   │   ├── FileDropzone.tsx             # Drag-and-drop upload with file list
│   │   ├── OptionCard.tsx               # Re-exports from global/OptionCard
│   │   ├── SummaryCard.tsx              # Summary text display card
│   │   └── UploadStep.tsx               # Step 1 upload UI (feature-aware)
│   │
│   └── quiz/
│       ├── FeedbackCard.tsx             # Per-question AI feedback card
│       ├── MCQAnswerOptions.tsx         # A/B/C/D answer cards with correct/wrong states
│       ├── OralAnswerPanel.tsx          # TTS + manual Record/Stop + Retry
│       ├── ScoreCard.tsx                # Feature icon + large score number
│       ├── WaveformVisualizer.tsx       # 20-bar canvas waveform (Web Audio API)
│       └── WrittenAnswerInput.tsx       # Full-height textarea with word count
│
├── hooks/
│   ├── useSummaryFlow.ts                # Summary flow state — persisted to localStorage
│   └── useQuizFlow.ts                   # Quiz options state — persisted to localStorage
│
├── lib/
│   ├── features.ts                      # Feature metadata (label, icon, routes, colours)
│   ├── quiz-mock.ts                     # Placeholder questions + feedback (until API ready)
│   ├── quiz-options.ts                  # Difficulty / count / type / input mode configs
│   ├── storage.ts                       # localStorage helpers + file → base64 utilities
│   └── summary-options.ts              # Summary length + style option definitions
│
└── types/
    ├── index.ts                         # Shared app-wide TypeScript types
    └── quiz.ts                          # All quiz-specific TypeScript types
```


---

# 🔌 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/summary/` | Generate document summary |
| `/api/summary/combined/` | Combined multi-doc summary |
| `/api/questions/` | RAG-powered Q&A |
| `/api/quiz/` | Generate quiz questions |
| `/api/quiz/evaluate/` | Grade answer + return feedback |


---

### URL Conventions

| URL | Description |
|-----|-------------|
| `/` | Homepage — feature picker |
| `/?selected=view-summary/upload` | Upload step for View Summary |
| `/?selected=ask-questions/upload` | Upload step for Ask Questions |
| `/?selected=quiz-time/upload` | Upload step for Quiz Time |
| `/view-summary/options?step=length` | Summary length picker (Step 2) |
| `/view-summary/options?step=style` | Summary style picker (Step 3, multi-doc only) |
| `/view-summary` | Final summary result page |
| `/q-and-a` | Q&A interface |
| `/quiz/options?step=difficulty` | Quiz setup — difficulty |
| `/quiz/options?step=count` | Quiz setup — question count |
| `/quiz/options?step=type` | Quiz setup — question type |
| `/quiz/options?step=input` | Quiz setup — input mode (theory only) |
| `/quiz/ready` | "Are you ready?" confirmation |
| `/quiz/play` | Question page (MCQ / Written / Oral) |
| `/quiz/score` | Score results |
| `/quiz/feedback` | Per-question AI feedback |

---


## Key design decisions

- **`components/global/OptionCard.tsx`** is the single source of truth for selectable option cards. `components/summary/OptionCard.tsx` re-exports it for backwards compatibility — both features use the identical component.
- **`hooks/useQuizFlow.ts`** and **`hooks/useSummaryFlow.ts`** handle all `localStorage` read/write. Pages never touch `localStorage` directly.
- **`lib/quiz-mock.ts`** provides placeholder questions and feedback until the Django API is wired up. Swap out the imports in `app/quiz/play/page.tsx` and `app/quiz/feedback/page.tsx` once the API is ready.
- The **`types/`** split keeps shared types (`FeatureMeta`, `StoredFileMeta`, etc.) separate from quiz-specific types (`QuizQuestion`, `QuizAnswerState`, `QuizResult`, etc.).