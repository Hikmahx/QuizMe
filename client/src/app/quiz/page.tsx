'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /quiz — entry point. Redirects straight into the options setup flow.
 * Full flow: /quiz/options → /quiz/ready → /quiz/play → /quiz/score → /quiz/feedback
 */
export default function QuizPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/quiz/options?step=difficulty');
  }, [router]);
  return null;
}
