import { ArrowLeft, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QRPanel } from '../../components/QRPanel'
import { RankingList, toRankRows } from '../../components/RankingList'
import { TimerBar } from '../../components/TimerBar'
import { Badge, Button, Card, PageShell, Spinner } from '../../components/ui'
import {
  advanceQuestion,
  beginQuiz,
  closeAndRevealAnswers,
  closeAnswers,
  fetchAnswerCount,
  fetchParticipants,
  fetchSession,
  fetchSessionQuestions,
  finishSession,
  openQuestion,
  revealAnswer,
  showRanking,
  startSession,
} from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { STATUS_LABEL, type Participant, type QuizSession, type SessionQuestion } from '../../lib/types'

export function SessionControlPage() {
  const { id } = useParams<{ id: string }>()
  const [session, setSession] = useState<QuizSession | null>(null)
  const [questions, setQuestions] = useState<SessionQuestion[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [answerCount, setAnswerCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const autoRevealKey = useRef<string | null>(null)

  const current = useMemo(
    () => questions.find((q) => q.order_index === session?.current_question_order),
    [questions, session?.current_question_order],
  )

  const reload = useCallback(async () => {
    if (!id) return
    const [s, qs, ps] = await Promise.all([
      fetchSession(id),
      fetchSessionQuestions(id),
      fetchParticipants(id),
    ])
    setSession(s)
    setQuestions(qs)
    setParticipants(ps)
    if (s && s.current_question_order > 0) {
      const q = qs.find((x) => x.order_index === s.current_question_order)
      if (q) setAnswerCount(await fetchAnswerCount(q.id))
    } else {
      setAnswerCount(0)
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    reload()
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro'))
      .finally(() => setLoading(false))

    const channel = supabase
      .channel(`admin-session-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quiz_sessions', filter: `id=eq.${id}` },
        () => void reload(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants', filter: `session_id=eq.${id}` },
        () => void reload(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'answers', filter: `session_id=eq.${id}` },
        () => void reload(),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [id, reload])

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na ação')
    } finally {
      setBusy(false)
    }
  }

  // Ao zerar o tempo da pergunta, encerra e revela o gabarito automaticamente
  useEffect(() => {
    if (!session || !current) return
    if (session.status !== 'question_open' || !current.opened_at) return

    const key = `${current.id}:${current.opened_at}`
    if (autoRevealKey.current === key) return

    const endsAt = new Date(current.opened_at).getTime() + current.time_seconds * 1000
    const delay = Math.max(0, endsAt - Date.now())

    const timer = window.setTimeout(() => {
      autoRevealKey.current = key
      void run(() => closeAndRevealAnswers(session.id))
    }, delay)

    return () => window.clearTimeout(timer)
  }, [session?.id, session?.status, current?.id, current?.opened_at, current?.time_seconds])

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
        <Link to="/admin/sessoes">Voltar</Link>
      </PageShell>
    )
  }

  const connected = participants.filter((p) => p.is_connected).length

  return (
    <PageShell>
      <Link to="/admin/sessoes" className="mb-2 inline-flex items-center gap-1 text-sm text-bayer-blue">
        <ArrowLeft size={14} /> Sessões
      </Link>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-bayer-blue">{session.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="green">{STATUS_LABEL[session.status]}</Badge>
            <span className="inline-flex items-center gap-1 text-sm text-muted">
              <Users size={14} /> {connected} conectados · {participants.length} no total
            </span>
          </div>
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <QRPanel sessionId={session.id} accessCode={session.access_code} />

          <Card className="p-5">
            <h3 className="font-bold text-bayer-blue">Controles do jogo</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {session.status === 'draft' && (
                <Button disabled={busy} onClick={() => void run(() => startSession(session.id))}>
                  Iniciar sessão (lobby)
                </Button>
              )}
              {session.status === 'lobby' && (
                <Button
                  variant="success"
                  disabled={busy}
                  onClick={() => void run(() => beginQuiz(session.id))}
                >
                  Liberar 1ª pergunta
                </Button>
              )}
              {session.status === 'question_open' && (
                <>
                  <Button
                    variant="warning"
                    disabled={busy}
                    onClick={() => void run(() => closeAndRevealAnswers(session.id))}
                  >
                    Encerrar e revelar gabarito
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void run(() => closeAnswers(session.id))}
                  >
                    Só encerrar respostas
                  </Button>
                </>
              )}
              {session.status === 'question_closed' && (
                <Button
                  disabled={busy}
                  onClick={() => void run(() => revealAnswer(session.id))}
                >
                  Revelar gabarito
                </Button>
              )}
              {(session.status === 'revealing' ||
                session.status === 'question_closed' ||
                session.status === 'ranking') && (
                <>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void run(() => showRanking(session.id))}
                  >
                    Exibir ranking
                  </Button>
                  <Button
                    variant="success"
                    disabled={busy}
                    onClick={() => void run(() => advanceQuestion(session.id))}
                  >
                    Avançar pergunta
                  </Button>
                </>
              )}
              {session.status !== 'finished' && session.status !== 'draft' && (
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={() => {
                    if (confirm('Encerrar sessão e gerar pódio final?')) {
                      void run(() => finishSession(session.id))
                    }
                  }}
                >
                  Encerrar sessão
                </Button>
              )}
              {session.status === 'ranking' && session.current_question_order > 0 && (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    void run(() => openQuestion(session.id, session.current_question_order))
                  }
                >
                  Reabrir pergunta atual
                </Button>
              )}
            </div>
          </Card>

          {current && (
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase text-muted">
                Pergunta {current.order_index} / {questions.length}
                {Number(current.points_multiplier) > 1
                  ? ` · multiplicador ${current.points_multiplier}x`
                  : ''}
                {` · ${current.time_seconds}s`}
              </p>
              {session.status === 'question_open' && (
                <div className="mt-3">
                  <TimerBar
                    openedAt={current.opened_at}
                    timeSeconds={current.time_seconds}
                    active
                  />
                  <p className="mt-1 text-xs text-muted">
                    Ao zerar, o gabarito é revelado automaticamente.
                  </p>
                </div>
              )}
              <p className="mt-2 font-semibold text-ink">{current.statement}</p>
              <p className="mt-3 text-sm text-muted">
                Respostas recebidas: <strong className="text-bayer-blue">{answerCount}</strong> /{' '}
                {participants.length}
              </p>
              {session.show_answer && (
                <p className="mt-2 rounded-xl bg-bayer-green/10 px-3 py-2 text-sm font-semibold text-bayer-green-dark">
                  Gabarito: {current.correct_option} — {current.explanation}
                </p>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <RankingList rows={toRankRows(participants, undefined, 10)} title="Ranking ao vivo" />
          <Card className="p-5">
            <h3 className="font-bold text-bayer-blue">Participantes</h3>
            <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
              {participants.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">
                    <span
                      className={`mr-2 inline-block h-2 w-2 rounded-full ${
                        p.is_connected ? 'bg-bayer-green' : 'bg-slate-300'
                      }`}
                    />
                    {p.nickname}
                  </span>
                  <span className="text-muted">{p.total_score} pts</span>
                </li>
              ))}
              {participants.length === 0 && (
                <li className="text-muted">Aguardando entrada via QR/link…</li>
              )}
            </ul>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}
