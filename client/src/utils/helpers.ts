export function renderMarkdown(text: string): string {
  return (
    text
      // Headings — must run before bold/italic so ## isn't treated as bold
      .replace(/^### (.+)$/gm, '<strong class="block text-app-text text-sm font-semibold mt-4 mb-1">$1</strong>')
      .replace(/^## (.+)$/gm,  '<strong class="block text-app-text text-base font-bold mt-5 mb-1">$1</strong>')
      .replace(/^# (.+)$/gm,   '<strong class="block text-app-text text-lg font-bold mt-5 mb-2">$1</strong>')
      // Bold and italic
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,     '<em>$1</em>')
      // Inline code
      .replace(/`(.+?)`/g, '<code class="bg-app-bg/60 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
      // Paragraph breaks (two or more newlines)
      .replace(/\n{2,}/g, '</p><p class="mt-2">')
      // Single line breaks
      .replace(/\n/g, '<br/>')
  );
}