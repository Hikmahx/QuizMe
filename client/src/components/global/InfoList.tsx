interface InfoListProps {
  items: string[];
}

/**
 * Renders a list of items with purple dot bullets.
 * Items support basic HTML via dangerouslySetInnerHTML for <strong> tags.
 */
export default function InfoList({ items }: InfoListProps) {
  return (
    <ul className='flex flex-col gap-4'>
      {items.map((item, i) => (
        <li key={i} className='flex items-start gap-3'>
          <span className='w-2 h-2 rounded-full bg-purple-500 mt-[6px] flex-shrink-0' />
          <p
            className='text-sm text-app-text-secondary leading-relaxed [&_strong]:text-app-text [&_strong]:font-medium'
            dangerouslySetInnerHTML={{ __html: item }}
          />
        </li>
      ))}
    </ul>
  );
}
