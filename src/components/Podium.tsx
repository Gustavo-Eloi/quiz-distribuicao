import { formatScore } from '../lib/scoring'
import type { Participant, ScoreSnapshot } from '../lib/types'
import { Card } from './ui'

type PodiumEntry = {
  nickname: string
  total_score: number
  rank: number
}

export function Podium({
  entries,
}: {
  entries: PodiumEntry[]
}) {
  const first = entries.find((e) => e.rank === 1)
  const second = entries.find((e) => e.rank === 2)
  const third = entries.find((e) => e.rank === 3)

  const Slot = ({
    entry,
    height,
    label,
    accent,
  }: {
    entry?: PodiumEntry
    height: string
    label: string
    accent: string
  }) => (
    <div className="flex flex-1 flex-col items-center">
      <div className="mb-3 text-center">
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="mt-1 truncate text-base font-bold text-ink sm:text-lg">
          {entry?.nickname || '—'}
        </p>
        <p className="text-sm font-semibold text-bayer-blue">
          {entry ? formatScore(entry.total_score) : '0'}
        </p>
      </div>
      <div
        className={`flex w-full items-end justify-center rounded-t-2xl ${accent} ${height} shadow-inner`}
      >
        <span className="mb-4 text-3xl font-bold text-white/90">{entry?.rank || '—'}</span>
      </div>
    </div>
  )

  return (
    <Card className="animate-rise overflow-hidden bg-gradient-to-b from-white to-slate-50 p-6 sm:p-8">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-bayer-green">Pódio final</p>
        <h2 className="mt-1 text-2xl font-bold text-bayer-blue sm:text-3xl">
          Quiz Distribuição
        </h2>
        <p className="mt-2 text-sm text-muted">Parabéns aos destaques da rodada</p>
      </div>
      <div className="flex items-end gap-2 sm:gap-4">
        <Slot entry={second} height="h-28 sm:h-36" label="2º lugar" accent="bg-slate-400" />
        <Slot entry={first} height="h-40 sm:h-52" label="1º lugar" accent="bg-bayer-blue" />
        <Slot entry={third} height="h-24 sm:h-28" label="3º lugar" accent="bg-bayer-green" />
      </div>
    </Card>
  )
}

export function podiumFromParticipants(participants: Participant[]): PodiumEntry[] {
  const sorted = [...participants].sort((a, b) => {
    if (b.total_score !== a.total_score) return b.total_score - a.total_score
    if (b.correct_count !== a.correct_count) return b.correct_count - a.correct_count
    return a.total_response_ms - b.total_response_ms
  })
  return sorted.slice(0, 3).map((p, i) => ({
    nickname: p.nickname,
    total_score: p.total_score,
    rank: i + 1,
  }))
}

export function podiumFromSnapshots(snapshots: ScoreSnapshot[]): PodiumEntry[] {
  return snapshots.slice(0, 3).map((s) => ({
    nickname: s.nickname,
    total_score: s.total_score,
    rank: s.rank_position,
  }))
}
