import { ReactNode } from 'react'

interface TwoColumnLayoutProps {
  left: ReactNode
  right: ReactNode
}

export default function TwoColumnLayout({ left, right }: TwoColumnLayoutProps) {
  return (
    <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 px-6 md:px-12 pb-12 max-w-[1200px] mx-auto w-full lg:items-center">
      <div className="lg:pr-16 py-6 lg:min-h-[420px]">{left}</div>
      <div className="flex flex-col gap-3.5 py-6">{right}</div>
    </main>
  )
}
