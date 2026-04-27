// Q&A feature types

export type QAMode = 'default' | 'resume' | 'compare' | 'glossary';

// Chat

export interface QAChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  // Special UI states
  modeChange?: QAMode; // renders a mode-switch chip in the user bubble
  fileChange?: string[]; // renders a file-selection chip in the user bubble
  showQuizCta?: boolean; // show the "Quiz Me" inline CTA button after message
  showQuizRedirect?: boolean; // show a "Go to Quiz →" navigation card after message
  modeSuggestions?: QAMode[]; // mismatch case — show clickable alternative mode badges
  isLoading?: boolean;

  // Auto mode detection suggestion (shown before first user message)
  // Renders "These documents look like X — switch to Y mode?" with yes/no buttons
  autoModeSuggestion?: {
    mode: QAMode;
    reason: string;
  };
}

// Left-panel screens

export type LeftScreenType =
  | 'info' // initial landing state
  | 'loading' // AI confirming mode
  | 'agent-steps' // Resume mode result
  | 'compare-table' // Compare mode result
  | 'glossary' // Glossary mode result
  | 'default-result'; // Default mode result

export interface AgentStep {
  id: string;
  icon: string; // ionicon name
  label: string;
  detail?: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

export interface CompareRow {
  aspect: string;
  values: string[]; // one per selected file
}

export interface GlossaryEntry {
  term: string;
  definition: string;
}

export interface LeftPanelScreen {
  id: string;
  type: LeftScreenType;
  mode: QAMode;
  label: string; // Short label for the screen indicator (e.g. "Resume analysis") */
  // mode-specific data
  agentSteps?: AgentStep[];
  compareFiles?: string[];
  compareRows?: CompareRow[];
  glossaryEntries?: GlossaryEntry[];
  defaultSummary?: string;
}
