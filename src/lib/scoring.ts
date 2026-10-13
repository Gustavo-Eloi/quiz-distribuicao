/** Pontuação: até 1000 pts na resposta correta mais rápida, decaindo até o fim do tempo × multiplicador. */
export function calculatePoints(
  isCorrect: boolean,
  responseTimeMs: number,
  timeSeconds: number,
  multiplier = 1,
): number {
  if (!isCorrect) return 0
  if (timeSeconds <= 0) return Math.round(1000 * multiplier)
  const ratio = Math.max(0, Math.min(1, 1 - responseTimeMs / (timeSeconds * 1000)))
  return Math.max(0, Math.round(1000 * ratio * multiplier))
}

export function formatScore(score: number): string {
  return score.toLocaleString('pt-BR')
}

export function formatMs(ms: number): string {
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

export function rankParticipants<
  T extends {
    total_score: number
    correct_count: number
    total_response_ms: number
    created_at?: string
  },
>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    if (b.total_score !== a.total_score) return b.total_score - a.total_score
    if (b.correct_count !== a.correct_count) return b.correct_count - a.correct_count
    if (a.total_response_ms !== b.total_response_ms) {
      return a.total_response_ms - b.total_response_ms
    }
    return (a.created_at || '').localeCompare(b.created_at || '')
  })
}
