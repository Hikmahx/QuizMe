# 📁 Project Structure

> Frontend only. Backend will live in `/backend`.

```
client/src/
├── app/
│   ├── page.tsx                              # Homepage + upload step (via ?selected=)
│   │
│   ├── api/                                  # Temporary Next.js API routes (replaced by Django)
│   │   ├── chat/route.ts                     # Streaming Groq chat — mode-aware system prompt
│   │   └── analyze/route.ts                  # Structured analysis — agent steps / compare / glossary
│   │
│   ├── view-summary/
│   │   ├── options/page.tsx                  # Step 2: length + style pickers
│   │   └── page.tsx                          # Step 3: summary result + doc navigator
│   │
│   ├── q-and-a/
│   │   ├── page.tsx                          # Step 2: mode selection (OptionCard list)
│   │   └── chat/page.tsx                     # Step 3: full two-column chat interface
│   │
│   └── quiz/
│       ├── page.tsx                          # Redirects → /quiz/options
│       ├── options/page.tsx                  # Steps: difficulty / count / type / input mode
│       ├── ready/page.tsx                    # "Are you ready?" confirmation
│       ├── play/page.tsx                     # Question page (MCQ / Written / Oral)
│       ├── score/page.tsx                    # Score results
│       └── feedback/page.tsx                 # Per-question AI feedback
│
├── components/
│   ├── global/                               # Shared across all features
│   │   ├── Breadcrumb.tsx                    # [icon] Feature › Step › Sub-step
│   │   ├── FeatureIcon.tsx                   # Coloured icon box
│   │   ├── Header.tsx                        # Logo + theme toggle
│   │   ├── InfoList.tsx                      # Purple-dot bullet list (left columns)
│   │   ├── OptionCard.tsx                    # Selectable card — used by summary, quiz, AND Q&A mode picker
│   │   ├── ProgressBar.tsx                   # Step progress indicator (Steps 1–2 only; not shown on final pages)
│   │   ├── QuizCTA.tsx                       # "Quiz Me" CTA — compact + full variants
│   │   ├── StepBadge.tsx                     # "Step N of M" pill
│   │   └── TwoColumnLayout.tsx               # Context left / action right — Steps 1 & 2
│   │
│   ├── home/
│   │   ├── Feature.tsx                       # Feature selection card
│   │   └── Home.tsx                          # Homepage wrapper
│   │
│   ├── summary/
│   │   ├── AddDocumentModal.tsx              # Modal with Upload / Paste tabs for adding more docs
│   │   ├── DocNavigator.tsx                  # ← → doc-by-doc navigation
│   │   ├── FileDropzone.tsx                  # Drop zone (no files) + file list (has files)
│   │   ├── FileNamingModal.tsx               # Naming modal for pasted text — detects .txt vs .md
│   │   ├── PasteTextInput.tsx                # Paste textarea with word count + Save button
│   │   ├── SummaryCard.tsx                   # Summary text display
│   │   └── UploadStep.tsx                    # Step 1 orchestrator — FileDropzone + PasteTextInput + AddDocumentModal
│   │
│   ├── qa/
│   │   ├── ChatPanel.tsx                     # Right-side chat — bubbles, mode chips, file chips, Quiz CTA
│   │   ├── ExportButton.tsx                  # Print-to-PDF for any panel
│   │   ├── FileChangeModal.tsx               # "Are you sure?" modal before file selection change applies
│   │   ├── FileSelectorPopover.tsx           # Dropdown — free toggle + Update button → triggers modal
│   │   ├── LeftPanel.tsx                     # Chevron navigator wrapping all panel screens + loading overlay
│   │   ├── ModeCard.tsx                      # (Legacy — superseded by global OptionCard on mode picker page)
│   │   └── panels/
│   │       ├── AgentStepsPanel.tsx           # Resume mode — progress bar + step timeline
│   │       ├── CompareTablePanel.tsx         # Compare mode — sticky headers, alternating rows
│   │       ├── DefaultResultPanel.tsx        # Default mode — file list + tips
│   │       ├── GlossaryPanel.tsx             # Glossary — search + horizontal alphabet bar + collapsible entries
│   │       ├── InfoPanel.tsx                 # Landing screen — "What you can do" + active files
│   │       └── LoadingPanel.tsx              # Animated overlay while AI is analysing
│   │
│   └── quiz/
│       ├── FeedbackCard.tsx                  # Per-question AI feedback card
│       ├── MCQAnswerOptions.tsx              # A/B/C/D cards with correct/wrong states
│       ├── OralAnswerPanel.tsx               # TTS + manual Record/Stop + Retry
│       ├── WaveformVisualizer.tsx            # 20-bar canvas waveform (Web Audio API)
│       └── WrittenAnswerInput.tsx            # Textarea with word count
│
├── hooks/
│   ├── useQAFlow.ts                          # Q&A state — mode, screens, chat, file selection, streaming
│   ├── useQuizFlow.ts                        # Quiz options — persisted to localStorage
│   └── useSummaryFlow.ts                     # Upload + summary flow — persisted to localStorage
│
├── lib/
│   ├── features.ts                           # Feature metadata (label, icon, routes, colours)
│   ├── file-extract.ts                       # Server-side text extraction: PDF (pdf-parse), DOCX (mammoth), text
│   ├── quiz-mock.ts                          # Placeholder questions + feedback (until Django API ready)
│   ├── quiz-options.ts                       # Difficulty / count / type / mode config
│   ├── storage.ts                            # localStorage helpers + file→base64 + pasteTextToStoredMeta
│   └── summary-options.ts                    # Summary length + style option definitions
│
└── types/
    ├── index.ts                              # Shared types: FeatureMeta, StoredFileMeta (+ source, wordCount)
    ├── ionicons.d.ts                         # Ionicons JSX type shim
    ├── qa.ts                                 # Q&A types: QAMode, QAChatMessage, LeftPanelScreen, AgentStep, etc.
    └── quiz.ts                               # Quiz types: QuizQuestion, QuizAnswerState, QuizResult, etc.
```

---

## 🔌 API Endpoints

### Temporary Next.js routes (active now)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/chat` | POST | Streaming Groq response — body: `{ mode, files, messages }` |
| `/api/analyze` | POST | Structured JSON analysis — body: `{ mode, files }` |

### Django endpoints (planned)

| Endpoint | Description |
|----------|-------------|
| `/api/summary/` | Generate document summary |
| `/api/summary/combined/` | Combined multi-doc summary |
| `/api/questions/` | RAG-powered Q&A (replaces `/api/chat` + `/api/analyze`) |
| `/api/quiz/` | Generate quiz questions |
| `/api/quiz/evaluate/` | Grade answer + return feedback |

**To migrate to Django:** change the two `fetch('/api/...')` calls in `hooks/useQAFlow.ts` to your Django URLs, then delete `src/app/api/`.

---

## 🗺️ URL Map

| URL | Description |
|-----|-------------|
| `/` | Homepage — feature picker + upload step |
| `/?selected=view-summary/upload` | Upload for View Summary |
| `/?selected=ask-questions/upload` | Upload for Ask Questions |
| `/?selected=quiz-time/upload` | Upload for Quiz Time |
| `/view-summary/options?step=length` | Summary length (Step 2) |
| `/view-summary/options?step=style` | Summary style (Step 2, multi-doc) |
| `/view-summary` | Summary result (Step 3) |
| `/q-and-a` | Q&A mode selection (Step 2) |
| `/q-and-a/chat?mode=[mode]` | Q&A chat (Step 3) — mode: default / resume / compare / glossary |
| `/quiz/options?step=difficulty` | Quiz setup — difficulty |
| `/quiz/options?step=count` | Quiz setup — question count |
| `/quiz/options?step=type` | Quiz setup — question type |
| `/quiz/options?step=input` | Quiz setup — answer mode (theory only) |
| `/quiz/ready` | "Are you ready?" confirmation |
| `/quiz/play` | Question page |
| `/quiz/score` | Score results |
| `/quiz/feedback` | Per-question feedback |

---

## 🔑 Key Design Decisions

### Upload / Paste text
- **`PasteTextInput`** is shown inline only when no files exist. Once a file is added, paste lives exclusively in `AddDocumentModal`.
- **`FileNamingModal`** uses `detectExtension()` (from `FileNamingModal.tsx`) to auto-classify content as `.md` or `.txt` before saving.
- **`pasteTextToStoredMeta()`** in `lib/storage.ts` converts raw text to a `StoredFileMeta` with `source: 'paste'` and `wordCount` — the file list shows this metadata instead of byte size.
- The right panel on the upload page is `calc(100vh - 200px)` with an `overflow-y-auto` scroll zone for the file list and a sticky bottom strip for Add / Continue / footnote.

### Q&A screen management
- **Max 4 left panel screens**: `[0]` landing + one per non-default mode (resume, compare, glossary)
- `isAnalysing` is an overlay flag — it never creates or removes a screen from the array
- Switching to a mode that already has a screen navigates to it and updates content in place
- Errors only produce a chat message — the screen array is never touched on failure
- `FileSelectorPopover` maintains its own local pending state; the confirmation modal fires only when the user explicitly clicks **Update**

### Shared components
- **`OptionCard`** (`components/global/OptionCard.tsx`) is the single selectable card component — used by summary options, quiz options, **and** the Q&A mode picker
- **`useSummaryFlow`** and **`useQuizFlow`** are the only places that touch `localStorage` — pages never read/write it directly
- **`lib/file-extract.ts`** is server-only (Node.js runtime) — never import it client-side
