import { renderMarkdown } from "@/utils/helpers";

interface SummaryCardProps {
  title: string;
  paragraphs: string[];
}

export default function SummaryCard({ title, paragraphs }: SummaryCardProps) {
  return (
    <div className='dark-bg rounded-2xl p-8 pt-0 text-app-text-secondary leading-relaxed text-[15px] h-full bg-app-card max-h-[80vh] overflow-y-scroll'>
      <h3 className='text-app-text text-lg font-semibold mb-4 sticky top-0 py-4 bg-app-card z-10'>{title}</h3>
      {paragraphs.filter(Boolean).map((p, i) => (
        <p key={i} className={'leading-relaxed text-sm ' + (i < paragraphs.length - 1 ? 'mb-4' : '')}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(p) }}>
        </p>
      ))}
    </div>
  );
}
