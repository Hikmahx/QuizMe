// Q&A feature types

export type QAMode = 'default' | 'resume' | 'compare' | 'glossary';

// Chat

export interface QAChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modeChange?: QAMode; // Rendered as a mode-switch chip in the user bubble
  fileChange?: string[]; // Rendered as a file-selection chip in the user bubble
  showQuizCta?: boolean; // Show the Quiz Me CTA button
  modeSuggestions?: QAMode[]; // Suggest alternative modes (rendered as clickable badges under the message)
  isLoading?: boolean;
  timestamp: number;
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
