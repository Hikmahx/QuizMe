import { StoredFileMeta, SummaryFlowState } from '@/types';

// Keys
const SUMMARY_FLOW_KEY = 'quizme:summary-flow';

// Constants for validation
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const MAX_FILES = 10;
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

function setItem(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or SSR — fail silently
  }
}

function removeItem(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

// Validation function
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds the 20MB limit (${formatFileSize(file.size)})`,
    };
  }

  // Check file extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ACCEPTED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `File "${file.name}" has an unsupported file type (.${ext || 'unknown'}). Allowed: ${ACCEPTED_EXTENSIONS.join(', ')}`,
    };
  }

  // Check MIME type (optional, as extensions are usually sufficient)
  if (!ACCEPTED_MIME_TYPES.includes(file.type) && file.type !== '') {
    console.warn(`File "${file.name}" has unexpected MIME type: ${file.type}`);
  }

  return { valid: true };
}

// File → base64 with improved error handling
export function fileToStoredMeta(file: File): Promise<StoredFileMeta> {
  return new Promise((resolve, reject) => {
    // Validate first
    const validation = validateFile(file);
    if (!validation.valid) {
      reject(new Error(validation.error));
      return;
    }

    const reader = new FileReader();
    let isResolved = false;

    // Set timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        reader.abort();
        reject(new Error(`Timeout reading file: ${file.name}`));
      }
    }, 30000); // 30 second timeout

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
    } catch (error) {
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

  // Process files sequentially to avoid overwhelming memory
  for (const file of files) {
    try {
      const stored = await fileToStoredMeta(file);
      results.push(stored);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (errors.length > 0) {
    console.warn('Some files failed to process:', errors);
  }

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

  // Validate stored files (they might be corrupted or too large)
  if (stored?.files && Array.isArray(stored.files)) {
    // Filter out any files that might be corrupted
    const validFiles = stored.files.filter(
      (file) =>
        file.name &&
        typeof file.size === 'number' &&
        file.size <= MAX_FILE_SIZE &&
        file.dataUrl &&
        typeof file.dataUrl === 'string',
    );

    if (validFiles.length !== stored.files.length) {
      // Save back the cleaned list
      setSummaryFlow({ files: validFiles });
      return { ...DEFAULT_SUMMARY_FLOW, ...stored, files: validFiles };
    }
  }

  return stored ?? DEFAULT_SUMMARY_FLOW;
}

export function setSummaryFlow(state: Partial<SummaryFlowState>): void {
  const current = getSummaryFlow();

  // Validate files before saving
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

  setItem(SUMMARY_FLOW_KEY, { ...current, ...validatedState });
}

export function clearSummaryFlow(): void {
  removeItem(SUMMARY_FLOW_KEY);
}

// Utility functions
export function formatFileSize(bytes: number): string {
  if (bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function fileExtension(name: string): string {
  const ext = name.split('.').pop();
  return ext?.toUpperCase() ?? 'FILE';
}

export function extColourClass(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'text-orange-400';
  if (ext === 'docx') return 'text-blue-400';
  if (ext === 'txt') return 'text-green-400';
  return 'text-gray-400';
}

// Helper to clean up large data URLs if needed (useful for memory management)
export function cleanupDataUrl(dataUrl: string): void {
  if (typeof window !== 'undefined' && dataUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(dataUrl);
    } catch {
      // Ignore cleanup errors
    }
  }
}

// Helper to get total size of all stored files
export function getTotalStorageSize(files: StoredFileMeta[]): number {
  return files.reduce((total, file) => total + (file.size || 0), 0);
}

// Warn if approaching localStorage limits (usually ~5-10MB)
export function checkStorageQuota(files: StoredFileMeta[]): boolean {
  const totalSize = getTotalStorageSize(files);
  const isApproachingLimit = totalSize > 4 * 1024 * 1024; // 4MB warning threshold

  if (isApproachingLimit) {
    console.warn(
      `Total file size (${formatFileSize(totalSize)}) is approaching localStorage limits. Consider using fewer or smaller files.`,
    );
  }

  return isApproachingLimit;
}
