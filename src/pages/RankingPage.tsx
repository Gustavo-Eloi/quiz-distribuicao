import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Podium, podiumFromParticipants } from '../components/Podium'
import { RankingList, toRankRows } from '../components/RankingList'
import { BrandHeader, Card, PageShell, Spinner } from '../components/ui'
import {
  fetchActiveOrLobbySession,
  fetchParticipants,
  fetchSession,
  fetchSessions,
} from '../lib/api'
import { supabase } from '../lib/supabase'
import type { Participant, QuizSession } from '../lib/types'

export function RankingPage() {
  const [params] = useSearchParams()
  const sessionParam = params.get('session')
  const [session, setSession] = useState<QuizSession | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    let s: QuizSession | null = null
    if (sessionParam) {
      s = await fetchSession(sessionParam)
    } else {
      s = await fetchActiveOrLobbySession()
      if (!s) {
        const all = await fetchSessions()
        s = all.find((x) => x.status === 'finished') || all[0] || null
      }
    }
    setSession(s)
    if (s) {
      setParticipants(await fetchParticipants(s.id))
    } else {
      setParticipants([])
    }
  }, [sessionParam])

  useEffect(() => {
    load()
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro'))
      .finally(() => setLoading(false))
  }, [load])

  useEffect(() => {
    if (!session?.id) return
    const channel = supabase
      .channel(`ranking-${session.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants', filter: `session_id=eq.${session.id}` },
        () => void load(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quiz_sessions', filter: `id=eq.${session.id}` },
        () => void load(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'score_snapshots',
          filter: `session_id=eq.${session.id}`,
        },
        () => void load(),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [session?.id, load])

  if (loading) {
    return (
      <PageShell>
        <BrandHeader compact />
        <Spinner />
      </PageShell>
    )
  }

  if (!session) {
    return (
      <PageShell>
        <BrandHeader />
        <Card className="p-6 text-center">
          <p className="font-semibold">Nenhuma sessão para exibir</p>
          <p className="mt-1 text-sm text-muted">{error || 'Inicie uma sessão no painel admin.'}</p>
        </Card>
      </PageShell>
    )
  }

  const finished = session.status === 'finished'
  const showPodium = finished || session.show_ranking

  return (
    <PageShell>
      <BrandHeader compact />
      <div className="mb-6 text-center">
        <p className="text-sm text-muted">{session.name}</p>
        <h2 className="text-xl font-bold text-bayer-blue">
          {finished ? 'Ranking final' : 'Ranking ao vivo'}
        </h2>
      </div>

      {showPodium && participants.length > 0 && (
        <div className="mb-6">
          <Podium entries={podiumFromParticipants(participants)} />
        </div>
      )}

      <RankingList
        rows={toRankRows(participants, undefined, finished ? 50 : 10)}
        title={finished ? 'Classificação completa' : 'Top 10'}
      />
    </PageShell>
  )
}
