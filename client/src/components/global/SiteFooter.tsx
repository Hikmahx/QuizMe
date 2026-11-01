import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className='mt-auto w-full py-6 text-center absolute inset-x-0 bottom-0'>
      <p className='text-[10px] font-thin text-app-text-secondary'>
        © {new Date().getFullYear()} QuizMe, all rights reserved. | Site by{' '}
        <Link
          href='https://github.com/Hikmahx'
          className='text-purple-800 underline underline-offset-2 hover:text-purple-900 dark:text-purple-300 dark:hover:text-purple-200'
          target='_blank'
          rel='noopener noreferrer'
        >
          Hikmahx
        </Link>
      </p>
    </footer>
  );
}
