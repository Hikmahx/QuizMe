interface ProgressBarProps {
  value: number
}

export default function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="h-1 w-full bg-app-text/10 rounded-full overflow-hidden mb-8">
      <div
        className="h-full bg-purple-500 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
