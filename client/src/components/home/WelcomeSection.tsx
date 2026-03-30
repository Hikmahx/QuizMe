'use client'

export default function WelcomeSection() {
  return (
    <section className="flex flex-col gap-12 md:gap-16">
      <h1 className="flex flex-col gap-3">
        <span className="text-xl md:text-2xl text-light-text dark:text-dark-text font-light">
          Welcome to the 
        </span>
        <span className="text-5xl md:text-6xl font-bold text-light-text dark:text-dark-text">
          QuizMe! App
        </span>
      </h1>
      <p className="text-lg md:text-xl text-light-text-secondary dark:text-dark-text-secondary italic font-light">
        Pick a feature to get started.
      </p>
    </section>
  )
}
