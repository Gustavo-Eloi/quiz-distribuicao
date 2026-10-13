import { formatMs, formatScore } from '../lib/scoring'
import type { Participant, ScoreSnapshot } from '../lib/types'
import { Badge, Card } from './ui'

type RankRow = {
  rank: number
  nickname: string
  total_score: number
  correct_count: number
  total_response_ms: number
  highlight?: boolean
}

export function toRankRows(
  participants: Participant[],
  highlightId?: string,
  limit = 10,
): RankRow[] {
  const sorted = [...participants].sort((a, b) => {
    if (b.total_score !== a.total_score) return b.total_score - a.total_score
    if (b.correct_count !== a.correct_count) return b.correct_count - a.correct_count
    return a.total_response_ms - b.total_response_ms
  })
  return sorted.slice(0, limit).map((p, i) => ({
    rank: i + 1,
    nickname: p.nickname,
    total_score: p.total_score,
    correct_count: p.correct_count,
    total_response_ms: p.total_response_ms,
    highlight: p.id === highlightId,
  }))
}

export function snapshotsToRows(snapshots: ScoreSnapshot[], highlightId?: string, limit = 10): RankRow[] {
  return snapshots.slice(0, limit).map((s) => ({
    rank: s.rank_position,
    nickname: s.nickname,
    total_score: s.total_score,
    correct_count: s.correct_count,
    total_response_ms: s.total_response_ms,
    highlight: s.participant_id === highlightId,
  }))
}

export function RankingList({
  rows,
  title = 'Top 10',
}: {
  rows: RankRow[]
  title?: string
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-bold text-bayer-blue">{title}</h2>
      </div>
      <ul className="divide-y divide-slate-100">
        {rows.length === 0 && (
          <li className="px-5 py-8 text-center text-sm text-muted">Aguardando pontuações…</li>
        )}
        {rows.map((row) => (
          <li
            key={`${row.rank}-${row.nickname}`}
            className={`flex items-center gap-3 px-5 py-3 ${row.highlight ? 'bg-bayer-green/10' : ''}`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                row.rank === 1
                  ? 'bg-bayer-yellow text-ink'
                  : row.rank === 2
                    ? 'bg-slate-200 text-ink'
                    : row.rank === 3
                      ? 'bg-amber-700/20 text-amber-900'
                      : 'bg-bayer-blue/10 text-bayer-blue'
              }`}
            >
              {row.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">
                {row.nickname}
                {row.highlight && (
                  <Badge tone="green">você</Badge>
                )}
              </p>
              <p className="text-xs text-muted">
                {row.correct_count} acertos · {formatMs(row.total_response_ms)}
              </p>
            </div>
            <p className="font-bold text-bayer-blue">{formatScore(row.total_score)}</p>
          </li>
        ))}
      </ul>
    </Card>
  )
}
