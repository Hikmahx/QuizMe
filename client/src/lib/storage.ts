import { StoredFileMeta, SummaryFlowState } from '@/types';

// Keys
const SUMMARY_FLOW_KEY = 'quizme:summary-flow';

// Constants for validation
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_FILES = 2;
export const ACCEPTED_EXTENSIONS = ['pdf', 'docx', 'txt'];
export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

// Generic helpers

function getItem(key: string): unknown {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setItem(key: string, value: unknown): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    // DOMException with name 'QuotaExceededError' on iOS Safari
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      console.warn(
        'localStorage quota exceeded. Files may not persist on this device. ' +
          'Try using smaller files or fewer files at once.',
      );
    }
    return false;
  }
}

function removeItem(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

// File validation

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds the 10 MB limit (${formatFileSize(file.size)})`,
    };
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ACCEPTED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `File "${file.name}" has an unsupported type (.${ext || 'unknown'}). Allowed: ${ACCEPTED_EXTENSIONS.join(', ')}`,
    };
  }

  if (!ACCEPTED_MIME_TYPES.includes(file.type) && file.type !== '') {
    console.warn(`File "${file.name}" has unexpected MIME type: ${file.type}`);
  }

  return { valid: true };
}

// File → StoredFileMeta

export function fileToStoredMeta(file: File): Promise<StoredFileMeta> {
  return new Promise((resolve, reject) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      reject(new Error(validation.error));
      return;
    }

    const reader = new FileReader();
    let isResolved = false;

    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        reader.abort();
        reject(new Error(`Timeout reading file: ${file.name}`));
      }
    }, 30_000);

    reader.onload = () => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        resolve({
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: reader.result as string,
        });
      }
    };

    reader.onerror = () => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        reject(new Error(`Failed to read file: ${file.name}`));
      }
    };

    reader.onabort = () => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        reject(new Error(`File reading aborted: ${file.name}`));
      }
    };

    try {
      reader.readAsDataURL(file);
    } catch {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to start reading file: ${file.name}`));
    }
  });
}

export async function filesToStoredMeta(
  files: File[],
): Promise<StoredFileMeta[]> {
  const results: StoredFileMeta[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      results.push(await fileToStoredMeta(file));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (errors.length > 0) console.warn('Some files failed to process:', errors);
  return results;
}

// Summary flow state

export const DEFAULT_SUMMARY_FLOW: SummaryFlowState = {
  files: [],
  length: null,
  style: null,
  step: 0,
};

export function getSummaryFlow(): SummaryFlowState {
  const stored = getItem(SUMMARY_FLOW_KEY) as SummaryFlowState | null;

  if (stored?.files && Array.isArray(stored.files)) {
    const validFiles = stored.files.filter(
      (file) =>
        file.name &&
        typeof file.size === 'number' &&
        file.size <= MAX_FILE_SIZE &&
        file.dataUrl &&
        typeof file.dataUrl === 'string',
    );

    if (validFiles.length !== stored.files.length) {
      setSummaryFlow({ files: validFiles });
      return { ...DEFAULT_SUMMARY_FLOW, ...stored, files: validFiles };
    }
  }

  return stored ?? DEFAULT_SUMMARY_FLOW;
}

export function setSummaryFlow(state: Partial<SummaryFlowState>): void {
  const current = getSummaryFlow();

  const validatedState = { ...state };
  if (state.files) {
    validatedState.files = state.files.filter(
      (file) =>
        file.name &&
        typeof file.size === 'number' &&
        file.size <= MAX_FILE_SIZE &&
        file.dataUrl &&
        typeof file.dataUrl === 'string',
    );
  }

  const saved = setItem(SUMMARY_FLOW_KEY, { ...current, ...validatedState });

  // If saving failed (quota exceeded on iOS), warn in the console.
  // The in-memory store still works for the current session.
  if (!saved) {
    console.warn(
      'Could not persist files to localStorage — likely iOS quota exceeded. ' +
        'Files will work for this session but will not survive a page refresh.',
    );
  }
}

export function clearSummaryFlow(): void {
  removeItem(SUMMARY_FLOW_KEY);
}

// Utilities

export function formatFileSize(bytes: number): string {
  if (bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function fileExtension(name: string): string {
  return name.split('.').pop()?.toUpperCase() ?? 'FILE';
}

export function extColourClass(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'text-orange-400';
  if (ext === 'docx') return 'text-blue-400';
  if (ext === 'txt' || ext === 'md') return 'text-green-400';
  return 'text-gray-400';
}

export function cleanupDataUrl(dataUrl: string): void {
  if (typeof window !== 'undefined' && dataUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(dataUrl);
    } catch {
      /* ignore */
    }
  }
}

export function pasteTextToStoredMeta(
  text: string,
  filename: string,
): StoredFileMeta {
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const mimeType = filename.endsWith('.md') ? 'text/markdown' : 'text/plain';
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  const dataUrl = `data:${mimeType};base64,${btoa(binary)}`;
  return {
    name: filename,
    size: bytes.length,
    type: mimeType,
    dataUrl,
    source: 'paste',
    wordCount,
  };
}

export function getTotalStorageSize(files: StoredFileMeta[]): number {
  return files.reduce((total, file) => total + (file.size || 0), 0);
}

export function checkStorageQuota(files: StoredFileMeta[]): boolean {
  const totalSize = getTotalStorageSize(files);
  // base64 inflates by ~1.33x, so 3 × 10 MB files ≈ ~40 MB base64.
  // iOS localStorage cap is ~5 MB, desktop is ~10 MB.
  // Warn when total base64 size approaches 4 MB.
  const base64Size = totalSize * 1.33;
  const isApproaching = base64Size > 4 * 1024 * 1024;
  if (isApproaching) {
    console.warn(
      `Estimated storage usage (${formatFileSize(base64Size)}) may exceed ` +
        `mobile browser limits. Files will work this session but may not persist on reload.`,
    );
  }
  return isApproaching;
}

export function getStoredCollectionId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const s = JSON.parse(localStorage.getItem('quizme:summary-flow') ?? '{}');
    const id = s.collectionId ?? s.collection_id ?? '';
    return typeof id === 'string' && id ? id : null;
  } catch {
    return null;
  }
}

export function toFilePayloads(files: StoredFileMeta[]) {
  return files.map(({ name, type, dataUrl }) => ({ name, type, dataUrl }));
}
