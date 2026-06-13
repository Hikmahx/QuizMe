export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileExtension(name: string): string {
  return name.split('.').pop()?.toUpperCase() ?? 'FILE';
}

export function extColor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return '#f97316';
  if (ext === 'docx' || ext === 'doc') return '#60a5fa';
  return '#26d782';
}

export function extBgColor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'rgba(249,115,22,0.18)';
  if (ext === 'docx' || ext === 'doc') return 'rgba(96,165,250,0.18)';
  return 'rgba(38,215,130,0.18)';
}
