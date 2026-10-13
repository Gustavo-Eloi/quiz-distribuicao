import { useEffect, useState } from 'react'

export function TimerBar({
  openedAt,
  timeSeconds,
  onExpire,
  active,
}: {
  openedAt: string | null
  timeSeconds: number
  onExpire?: () => void
  active: boolean
}) {
  const [remaining, setRemaining] = useState(timeSeconds)

  useEffect(() => {
    if (!active || !openedAt) {
      setRemaining(timeSeconds)
      return
    }

    const tick = () => {
      const elapsed = (Date.now() - new Date(openedAt).getTime()) / 1000
      const left = Math.max(0, timeSeconds - elapsed)
      setRemaining(left)
      if (left <= 0) onExpire?.()
    }

    tick()
    const id = window.setInterval(tick, 100)
    return () => window.clearInterval(id)
  }, [active, openedAt, timeSeconds, onExpire])

  const pct = timeSeconds > 0 ? (remaining / timeSeconds) * 100 : 0
  const urgent = remaining <= 5

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-muted">Tempo</span>
        <span className={`font-bold tabular-nums ${urgent ? 'text-amber-700' : 'text-bayer-blue'}`}>
          {Math.ceil(remaining)}s
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full origin-left rounded-full transition-[width] duration-100 ${
            urgent ? 'bg-bayer-yellow' : 'bg-bayer-cyan'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
