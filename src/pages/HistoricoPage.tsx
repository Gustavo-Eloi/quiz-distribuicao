import { ArrowLeft, Download } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RankingList, toRankRows } from '../components/RankingList'
import { Badge, Button, Card, Input, Label, PageShell, Select, Spinner } from '../components/ui'
import {
  fetchAllAnswers,
  fetchParticipants,
  fetchSession,
  fetchSessionQuestions,
  fetchSessions,
} from '../lib/api'
import { downloadCsv, toCsv } from '../lib/csv'
import { formatMs, formatScore } from '../lib/scoring'
import type { Answer, Participant, QuizSession, SessionQuestion } from '../lib/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface SessionSummary {
  session: QuizSession
  participants: Participant[]
  questions: SessionQuestion[]
  answers: Answer[]
}

export function HistoricoPage() {
  const [sessions, setSessions] = useState<QuizSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [themeFilter, setThemeFilter] = useState('')
  const [summaries, setSummaries] = useState<Record<string, SessionSummary>>({})

  useEffect(() => {
    ;(async () => {
      try {
        const list = await fetchSessions()
        const finished = list.filter((s) => s.status === 'finished')
        setSessions(finished)
        const map: Record<string, SessionSummary> = {}
        await Promise.all(
          finished.map(async (s) => {
            const [participants, questions, answers] = await Promise.all([
              fetchParticipants(s.id),
              fetchSessionQuestions(s.id),
              fetchAllAnswers(s.id),
            ])
            map[s.id] = { session: s, participants, questions, answers }
          }),
        )
        setSummaries(map)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar histórico')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const themes = useMemo(() => {
    const set = new Set<string>()
    Object.values(summaries).forEach((s) => s.questions.forEach((q) => set.add(q.theme)))
    return [...set].sort()
  }, [summaries])

  const filtered = sessions.filter((s) => {
    const sum = summaries[s.id]
    if (dateFrom && new Date(s.created_at) < new Date(dateFrom)) return false
    if (dateTo && new Date(s.created_at) > new Date(`${dateTo}T23:59:59`)) return false
    if (themeFilter && sum && !sum.questions.some((q) => q.theme === themeFilter)) return false
    return true
  })

  const winnerOf = (participants: Participant[]) => {
    const sorted = [...participants].sort((a, b) => {
      if (b.total_score !== a.total_score) return b.total_score - a.total_score
      if (b.correct_count !== a.correct_count) return b.correct_count - a.correct_count
      return a.total_response_ms - b.total_response_ms
    })
    return sorted[0]
  }

  const avgAccuracy = (sum: SessionSummary) => {
    if (sum.answers.length === 0) return 0
    const correct = sum.answers.filter((a) => a.is_correct).length
    return Math.round((correct / sum.answers.length) * 100)
  }

  if (loading) {
    return (
      <PageShell>
        <Spinner />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <Link to="/admin" className="mb-2 inline-flex items-center gap-1 text-sm text-bayer-blue">
        <ArrowLeft size={14} /> Admin
      </Link>
      <h1 className="mb-1 text-2xl font-bold text-bayer-blue">Histórico</h1>
      <p className="mb-6 text-sm text-muted">
        Sessões, participantes, respostas e rankings preservados permanentemente.
      </p>

      <Card className="mb-4 grid gap-3 p-4 sm:grid-cols-3">
        <div>
          <Label>Data inicial</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <Label>Data final</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div>
          <Label>Tema</Label>
          <Select value={themeFilter} onChange={(e) => setThemeFilter(e.target.value)}>
            <option value="">Todos</option>
            {themes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="space-y-3">
        {filtered.map((s) => {
          const sum = summaries[s.id]
          const winner = sum ? winnerOf(sum.participants) : undefined
          return (
            <Card key={s.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{s.name}</p>
                  <p className="text-xs text-muted">
                    {format(new Date(s.finished_at || s.created_at), "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                  {sum && (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <Badge tone="slate">{sum.participants.length} participantes</Badge>
                      <Badge tone="slate">{sum.questions.length} perguntas</Badge>
                      <Badge tone="green">Média acertos {avgAccuracy(sum)}%</Badge>
                      {winner && <Badge>Vencedor: {winner.nickname}</Badge>}
                    </div>
                  )}
                </div>
                <Link to={`/historico/${s.id}`}>
                  <Button size="sm" variant="secondary">
                    Detalhes
                  </Button>
                </Link>
              </div>
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">Nenhuma sessão concluída encontrada.</p>
        )}
      </div>
    </PageShell>
  )
}

export function HistoricoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [session, setSession] = useState<QuizSession | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [questions, setQuestions] = useState<SessionQuestion[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [tagFilter, setTagFilter] = useState('')
  const [diffFilter, setDiffFilter] = useState('')

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const [s, ps, qs, ans] = await Promise.all([
          fetchSession(id),
          fetchParticipants(id),
          fetchSessionQuestions(id),
          fetchAllAnswers(id),
        ])
        setSession(s)
        setParticipants(ps)
        setQuestions(qs)
        setAnswers(ans)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const questionStats = useMemo(() => {
    return questions.map((q) => {
      const qAnswers = answers.filter((a) => a.session_question_id === q.id)
      const correct = qAnswers.filter((a) => a.is_correct).length
      const avgTime =
        qAnswers.length > 0
          ? Math.round(qAnswers.reduce((acc, a) => acc + a.response_time_ms, 0) / qAnswers.length)
          : 0
      const accuracy = qAnswers.length ? Math.round((correct / qAnswers.length) * 100) : 0
      const errors = qAnswers.length - correct
      return { q, qAnswers, correct, avgTime, accuracy, errors }
    })
  }, [questions, answers])

  const filteredStats = questionStats.filter((s) => {
    if (diffFilter && s.q.difficulty !== diffFilter) return false
    if (tagFilter && !(s.q.tags || []).includes(tagFilter)) return false
    return true
  })

  const hardest = [...questionStats].sort((a, b) => b.errors - a.errors).slice(0, 3)
  const tags = [...new Set(questions.flatMap((q) => q.tags || []))].sort()

  const exportCsv = () => {
    if (!session) return
    const headers = [
      'rank',
      'nickname',
      'total_score',
      'correct_count',
      'total_response_ms',
    ]
    const sorted = [...participants].sort((a, b) => {
      if (b.total_score !== a.total_score) return b.total_score - a.total_score
      if (b.correct_count !== a.correct_count) return b.correct_count - a.correct_count
      return a.total_response_ms - b.total_response_ms
    })
    const rows = sorted.map((p, i) => [
      i + 1,
      p.nickname,
      p.total_score,
      p.correct_count,
      p.total_response_ms,
    ])
    downloadCsv(`historico-${session.access_code}.csv`, toCsv(headers, rows))
  }

  if (loading) {
    return (
      <PageShell>
        <Spinner />
      </PageShell>
    )
  }

  if (!session) {
    return (
      <PageShell>
        <p>Sessão não encontrada.</p>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <Link to="/historico" className="mb-2 inline-flex items-center gap-1 text-sm text-bayer-blue">
        <ArrowLeft size={14} /> Histórico
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-bayer-blue">{session.name}</h1>
          <p className="text-sm text-muted">
            {format(new Date(session.finished_at || session.created_at), "dd/MM/yyyy HH:mm", {
              locale: ptBR,
            })}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={exportCsv}>
          <Download size={14} /> Exportar CSV
        </Button>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <RankingList rows={toRankRows(participants, undefined, 50)} title="Ranking final" />
        <Card className="p-5">
          <h3 className="font-bold text-bayer-blue">Perguntas com mais erros</h3>
          <ul className="mt-3 space-y-3">
            {hardest.map(({ q, errors, accuracy }) => (
              <li key={q.id} className="text-sm">
                <p className="font-medium text-ink line-clamp-2">{q.statement}</p>
                <p className="text-muted">
                  {errors} erros · {accuracy}% de acerto
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mb-4 grid gap-3 p-4 sm:grid-cols-2">
        <div>
          <Label>Dificuldade</Label>
          <Select value={diffFilter} onChange={(e) => setDiffFilter(e.target.value)}>
            <option value="">Todas</option>
            <option value="facil">Fácil</option>
            <option value="medio">Médio</option>
            <option value="dificil">Difícil</option>
          </Select>
        </div>
        <div>
          <Label>Tag</Label>
          <Select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
            <option value="">Todas</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <div className="space-y-3">
        <h3 className="font-bold text-bayer-blue">Desempenho por pergunta</h3>
        {filteredStats.map(({ q, accuracy, avgTime, qAnswers }) => (
          <Card key={q.id} className="p-4">
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge>#{q.order_index}</Badge>
              <Badge tone="slate">{q.theme}</Badge>
              {Number(q.points_multiplier) > 1 && (
                <Badge tone="yellow">{q.points_multiplier}x</Badge>
              )}
            </div>
            <p className="font-medium text-ink">{q.statement}</p>
            <p className="mt-2 text-sm text-muted">
              Acerto {accuracy}% · tempo médio {formatMs(avgTime)} · {qAnswers.length} respostas ·
              gabarito {q.correct_option}
            </p>
          </Card>
        ))}
      </div>

      <Card className="mt-6 overflow-x-auto p-4">
        <h3 className="mb-3 font-bold text-bayer-blue">Participantes</h3>
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="pb-2 font-medium">#</th>
              <th className="pb-2 font-medium">Nome</th>
              <th className="pb-2 font-medium">Pontos</th>
              <th className="pb-2 font-medium">Acertos</th>
              <th className="pb-2 font-medium">Tempo</th>
            </tr>
          </thead>
          <tbody>
            {[...participants]
              .sort((a, b) => {
                if (b.total_score !== a.total_score) return b.total_score - a.total_score
                if (b.correct_count !== a.correct_count) return b.correct_count - a.correct_count
                return a.total_response_ms - b.total_response_ms
              })
              .map((p, i) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="py-2">{i + 1}</td>
                  <td className="py-2 font-medium">{p.nickname}</td>
                  <td className="py-2">{formatScore(p.total_score)}</td>
                  <td className="py-2">{p.correct_count}</td>
                  <td className="py-2">{formatMs(p.total_response_ms)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </PageShell>
  )
}
