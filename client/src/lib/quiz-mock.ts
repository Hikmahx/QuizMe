import { QuizQuestion } from '@/types/quiz'

export const MOCK_MCQ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    text: 'Which of these color contrast ratios defines the minimum WCAG 2.1 Level AA requirement for normal text?',
    options: [
      { letter: 'A', text: '4.5:1' },
      { letter: 'B', text: '3:1' },
      { letter: 'C', text: '2.5:1' },
      { letter: 'D', text: '5:1' },
    ],
    correctIndex: 0,
  },
  {
    id: 2,
    text: 'What does RAG stand for in the context of AI systems?',
    options: [
      { letter: 'A', text: 'Random Answer Generation' },
      { letter: 'B', text: 'Retrieval-Augmented Generation' },
      { letter: 'C', text: 'Recursive Attention Graph' },
      { letter: 'D', text: 'Robust Attention Gateway' },
    ],
    correctIndex: 1,
  },
  {
    id: 3,
    text: 'Which HTML element is used to define important text?',
    options: [
      { letter: 'A', text: '<i>' },
      { letter: 'B', text: '<em>' },
      { letter: 'C', text: '<strong>' },
      { letter: 'D', text: '<b>' },
    ],
    correctIndex: 2,
  },
  {
    id: 4,
    text: 'What is the correct CSS property to change the text colour of an element?',
    options: [
      { letter: 'A', text: 'font-color' },
      { letter: 'B', text: 'text-color' },
      { letter: 'C', text: 'color' },
      { letter: 'D', text: 'foreground' },
    ],
    correctIndex: 2,
  },
  {
    id: 5,
    text: 'In JavaScript, which method is used to add an element to the end of an array?',
    options: [
      { letter: 'A', text: 'push()' },
      { letter: 'B', text: 'pop()' },
      { letter: 'C', text: 'shift()' },
      { letter: 'D', text: 'splice()' },
    ],
    correctIndex: 0,
  },
]

export const MOCK_THEORY_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    text: 'Explain the concept of Retrieval-Augmented Generation (RAG) and describe how it improves the accuracy of AI-generated responses.',
  },
  {
    id: 2,
    text: 'What are the key differences between supervised and unsupervised learning? Provide an example of each.',
  },
  {
    id: 3,
    text: 'Describe the role of embeddings in natural language processing and explain how they are used in vector databases.',
  },
  {
    id: 4,
    text: 'What is overfitting in machine learning and what techniques can be used to prevent it?',
  },
  {
    id: 5,
    text: 'Explain the transformer architecture and the significance of the self-attention mechanism.',
  },
]

export const MOCK_FEEDBACKS = [
  { explanation: 'WCAG 2.1 Level AA requires a minimum contrast ratio of 4.5:1 for normal text to ensure readability for users with visual impairments.', tip: 'Remember: larger text (18pt+) only needs a 3:1 ratio.' },
  { explanation: 'RAG combines a retrieval system with a generative model. The retrieval step fetches relevant document chunks; the generation step produces an answer grounded in those chunks.', tip: 'Think of it as giving the LLM a open-book exam with the right pages already open.' },
  { explanation: 'The <strong> element indicates strong importance. Screen readers may add vocal emphasis when reading it.', tip: 'Use <strong> for semantic importance, <b> only for visual bold without extra meaning.' },
  { explanation: 'The CSS color property sets the foreground (text) color of an element.', tip: 'font-color and text-color are common mistakes — neither is valid CSS.' },
  { explanation: 'Array.push() adds one or more elements to the end and returns the new length.', tip: 'pop() removes the last element; shift() removes the first; unshift() adds to the start.' },
]
