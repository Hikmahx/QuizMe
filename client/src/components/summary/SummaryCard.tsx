interface SummaryCardProps {
  title: string;
  paragraphs: string[];
}

export default function SummaryCard({ title, paragraphs }: SummaryCardProps) {
  return (
    <div className='dark-bg rounded-2xl p-8 text-blue-100 leading-relaxed text-[15px]'>
      <h3 className='text-app-text text-lg font-semibold mb-4'>{title}</h3>
      {paragraphs.filter(Boolean).map((p, i) => (
        <p key={i} className={i < paragraphs.length - 1 ? 'mb-4' : ''}>
          {p}
        </p>
      ))}
    </div>
  );
}
