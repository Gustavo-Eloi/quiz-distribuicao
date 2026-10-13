import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TimerBar } from '../components/TimerBar'
import { BrandHeader, Button, Card, Input, Label, PageShell, Spinner } from '../components/ui'
import {
  fetchActiveOrLobbySession,
  fetchOwnParticipant,
  fetchParticipantAnswer,
  fetchParticipants,
  fetchSession,
  fetchSessionQuestions,
  joinSession,
  submitAnswer,
} from '../lib/api'
import { formatScore } from '../lib/scoring'
import {
  clearParticipant,
  getClientToken,
  loadParticipant,
  saveParticipant,
} from '../lib/storage'
import { supabase } from '../lib/supabase'
import type { Answer, OptionKey, Participant, QuizSession, SessionQuestion } from '../lib/types'

export function PlayPage() {
  const [params] = useSearchParams()
  const sessionParam = params.get('session')

  const [nickname, setNickname] = useState('')
  const [joined, setJoined] = useState(false)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [session, setSession] = useState<QuizSession | null>(null)
  const [questions, setQuestions] = useState<SessionQuestion[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [myAnswer, setMyAnswer] = useState<Answer | null>(null)
  const [selected, setSelected] = useState<OptionKey | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [openedAtLocal, setOpenedAtLocal] = useState<string | null>(null)

  const current = useMemo(
    () => questions.find((q) => q.order_index === session?.current_question_order),
    [questions, session?.current_question_order],
  )

  const myRank = useMemo(() => {
    if (!participant) return null
    const sorted = [...participants].sort((a, b) => {
      if (b.total_score !== a.total_score) return b.total_score - a.total_score
      if (b.correct_count !== a.correct_count) return b.correct_count - a.correct_count
      return a.total_response_ms - b.total_response_ms
    })
    const idx = sorted.findIndex((p) => p.id === participant.id)
    return idx >= 0 ? idx + 1 : null
  }, [participants, participant])

  const syncSession = useCallback(async (sessionId: string) => {
    const [s, qs, ps] = await Promise.all([
      fetchSession(sessionId),
      fetchSessionQuestions(sessionId),
      fetchParticipants(sessionId),
    ])
    setSession(s)
    setQuestions(qs)
    setParticipants(ps)

    const stored = loadParticipant()
    if (stored && stored.sessionId === sessionId) {
      const me = await fetchOwnParticipant(sessionId, stored.clientToken)
      setParticipant(me)
      setJoined(Boolean(me))
    }

    const q = qs.find((x) => x.order_index === s?.current_question_order)
    if (stored && q) {
      const ans = await fetchParticipantAnswer(stored.id, stored.clientToken, q.id)
      setMyAnswer(ans)
      if (ans) setSelected(ans.selected_option)
    } else {
      setMyAnswer(null)
      setSelected(null)
    }

    if (s?.status === 'question_open' && q?.opened_at) {
      setOpenedAtLocal(q.opened_at)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        let s: QuizSession | null = null
        if (sessionParam) {
          s = await fetchSession(sessionParam)
        } else {
          s = await fetchActiveOrLobbySession()
        }
        if (cancelled) return
        if (!s) {
          setError('Nenhuma sessão ativa no momento. Aguarde o apresentador.')
          setLoading(false)
          return
        }
        await syncSession(s.id)

        const stored = loadParticipant()
        if (stored && stored.sessionId === s.id) {
          setNickname(stored.nickname)
          setJoined(true)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sessionParam, syncSession])

  useEffect(() => {
    if (!session?.id) return
    const channel = supabase
      .channel(`play-${session.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quiz_sessions', filter: `id=eq.${session.id}` },
        () => void syncSession(session.id),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_questions',
          filter: `session_id=eq.${session.id}`,
        },
        () => void syncSession(session.id),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `session_id=eq.${session.id}`,
        },
        () => void syncSession(session.id),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [session?.id, syncSession])

  // Reset local answer state when question changes
  useEffect(() => {
    setSelected(null)
    setMyAnswer(null)
    setOpenedAtLocal(current?.opened_at || null)
  }, [current?.id, session?.current_question_order])

  const onJoin = async (e: FormEvent) => {
    e.preventDefault()
    if (!session || !nickname.trim()) return
    setError('')
    try {
      const token = getClientToken()
      const p = await joinSession(session.id, nickname.trim(), token)
      saveParticipant({
        id: p.id,
        sessionId: session.id,
        nickname: p.nickname,
        clientToken: token,
      })
      setParticipant(p)
      setJoined(true)
      await syncSession(session.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar')
    }
  }

  const onSelect = async (key: OptionKey) => {
    if (!session || !participant || !current) return
    if (session.status !== 'question_open') return
    if (myAnswer) return
    setSelected(key)
    setSubmitting(true)
    setError('')
    try {
      const opened = openedAtLocal || current.opened_at || new Date().toISOString()
      const responseTimeMs = Math.max(0, Date.now() - new Date(opened).getTime())
      const token = getClientToken()
      const ans = await submitAnswer(participant.id, token, current.id, key, responseTimeMs)
      setMyAnswer(ans)
      await syncSession(session.id)
    } catch (err) {
      setSelected(null)
      setError(err instanceof Error ? err.message : 'Erro ao enviar resposta')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PageShell className="max-w-lg">
        <BrandHeader compact />
        <Spinner />
      </PageShell>
    )
  }

  if (!session) {
    return (
      <PageShell className="max-w-lg">
        <BrandHeader />
        <Card className="p-6 text-center">
          <p className="font-semibold text-ink">Aguardando sessão</p>
          <p className="mt-2 text-sm text-muted">{error || 'O apresentador ainda não liberou o jogo.'}</p>
        </Card>
      </PageShell>
    )
  }

  if (!joined) {
    return (
      <PageShell className="max-w-lg">
        <BrandHeader />
        <Card className="animate-rise p-6">
          <h2 className="text-lg font-bold text-ink">Entre no desafio</h2>
          <p className="mt-1 text-sm text-muted">Sessão: {session.name}</p>
          <form className="mt-5 space-y-4" onSubmit={onJoin}>
            <div>
              <Label>Nome ou apelido</Label>
              <Input
                required
                maxLength={24}
                placeholder="Como quer aparecer no ranking?"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" size="lg">
              Entrar
            </Button>
          </form>
        </Card>
      </PageShell>
    )
  }

  const canAnswer = session.status === 'question_open' && !myAnswer
  const showResult =
    session.show_answer && myAnswer && current && ['revealing', 'ranking', 'finished'].includes(session.status)

  return (
    <PageShell className="max-w-lg">
      <BrandHeader compact />
      <div className="mb-4 flex items-center justify-between text-sm">
        <p className="font-semibold text-ink">{participant?.nickname}</p>
        <p className="text-muted">
          {formatScore(participant?.total_score || 0)} pts
          {myRank ? ` · #${myRank}` : ''}
        </p>
      </div>

      {(session.status === 'lobby' || session.status === 'active') && (
        <Card className="animate-rise p-6 text-center">
          <div className="relative mx-auto mb-4 h-16 w-16">
            <div className="animate-pulse-ring absolute inset-0 rounded-full bg-bayer-cyan/30" />
            <div className="absolute inset-2 rounded-full bg-bayer-blue" />
          </div>
          <p className="font-bold text-bayer-blue">Tudo pronto!</p>
          <p className="mt-2 text-sm text-muted">
            Aguarde o apresentador liberar a próxima pergunta.
          </p>
        </Card>
      )}

      {current &&
        ['question_open', 'question_closed', 'revealing', 'ranking'].includes(session.status) && (
          <Card className="animate-rise space-y-4 p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase text-muted">
                Pergunta {current.order_index} / {questions.length}
              </p>
              {Number(current.points_multiplier) > 1 && (
                <span className="rounded-lg bg-bayer-yellow/40 px-2 py-0.5 text-xs font-bold text-amber-900">
                  {current.points_multiplier}x pontos
                </span>
              )}
            </div>
            <TimerBar
              openedAt={openedAtLocal || current.opened_at}
              timeSeconds={current.time_seconds}
              active={session.status === 'question_open' && !myAnswer}
            />
            <h2 className="text-lg font-bold leading-snug text-ink">{current.statement}</h2>
            <div className="grid gap-2">
              {([
                ['A', current.option_a],
                ['B', current.option_b],
                ['C', current.option_c],
                ['D', current.option_d],
              ] as [OptionKey, string][]).map(([key, text]) => {
                const isMine = selected === key || myAnswer?.selected_option === key
                const isCorrect = session.show_answer && current.correct_option === key
                const isWrong =
                  session.show_answer && isMine && myAnswer && !myAnswer.is_correct
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!canAnswer || submitting}
                    onClick={() => void onSelect(key)}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      isCorrect
                        ? 'border-bayer-green bg-bayer-green/15'
                        : isWrong
                          ? 'border-red-300 bg-red-50'
                          : isMine
                            ? 'border-bayer-cyan bg-bayer-cyan/10'
                            : 'border-slate-200 bg-white hover:border-bayer-blue/40'
                    } disabled:opacity-80`}
                  >
                    <span className="mr-2 font-bold text-bayer-blue">{key}.</span>
                    {text}
                  </button>
                )
              })}
            </div>

            {myAnswer && session.status === 'question_open' && (
              <p className="text-center text-sm font-medium text-bayer-green-dark">
                Resposta enviada! Aguarde o encerramento.
              </p>
            )}
            {session.status === 'question_closed' && !session.show_answer && (
              <p className="text-center text-sm text-muted">
                Respostas encerradas. Aguarde o gabarito…
              </p>
            )}
            {showResult && (
              <div
                className={`rounded-xl px-4 py-3 text-sm ${
                  myAnswer.is_correct ? 'bg-bayer-green/15 text-bayer-green-dark' : 'bg-red-50 text-red-700'
                }`}
              >
                <p className="font-bold">
                  {myAnswer.is_correct ? 'Você acertou!' : 'Você errou.'}
                </p>
                <p className="mt-1">
                  Pontuação nesta pergunta: <strong>{formatScore(myAnswer.points_awarded)}</strong>
                </p>
                <p>
                  Posição atual: <strong>#{myRank}</strong> · Total:{' '}
                  <strong>{formatScore(participant?.total_score || 0)}</strong>
                </p>
                {current.explanation && (
                  <p className="mt-2 text-muted">{current.explanation}</p>
                )}
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </Card>
        )}

      {session.status === 'finished' && (
        <Card className="animate-rise p-6 text-center">
          <p className="text-sm font-semibold uppercase text-bayer-green">Sessão encerrada</p>
          <p className="mt-2 text-2xl font-bold text-bayer-blue">
            #{myRank} · {formatScore(participant?.total_score || 0)} pts
          </p>
          <p className="mt-2 text-sm text-muted">Confira o pódio na tela de ranking.</p>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => {
              clearParticipant()
              window.location.href = `/ranking?session=${session.id}`
            }}
          >
            Ver ranking
          </Button>
        </Card>
      )}
    </PageShell>
  )
}
