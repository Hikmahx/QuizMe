import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  title?: string;
  showBackLink?: boolean;
}

export default function Header({ title, showBackLink = false }: HeaderProps) {
  return (
    <div className='flex justify-between items-center my-24'>
      {title && (
        <Link
          href='/'
          className='text-2xl md:text-3xl font-bold text-light-text dark:text-dark-text hover:text-primary transition-colors'
        >
          {title}
        </Link>
      )}
      <ThemeToggle />
    </div>
  );
}
