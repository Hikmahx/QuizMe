interface StepBadgeProps {
  current: number
  total: number
  label?: string
}

export default function StepBadge({ current, total, label }: StepBadgeProps) {
  return (
    <span className="inline-flex items-center gap-2 bg-purple-500/15 border border-purple-500/30 rounded-full px-4 py-1.5 text-sm text-purple-400 font-medium mb-6">
      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
      {label ?? `Step ${current} of ${total}`}
    </span>
  )
}
