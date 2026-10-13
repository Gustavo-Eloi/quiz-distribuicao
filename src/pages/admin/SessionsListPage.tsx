import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, PageShell, Spinner } from '../../components/ui'
import { fetchSessions } from '../../lib/api'
import { STATUS_LABEL, type QuizSession } from '../../lib/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function SessionsListPage() {
  const [sessions, setSessions] = useState<QuizSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSessions()
      .then(setSessions)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageShell>
      <Link to="/admin" className="mb-2 inline-flex items-center gap-1 text-sm text-bayer-blue">
        <ArrowLeft size={14} /> Voltar
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-bayer-blue">Sessões</h1>
          <p className="text-sm text-muted">Controle ao vivo e histórico de jogos.</p>
        </div>
        <Link to="/admin/sessoes/nova">
          <Button>Criar sessão</Button>
        </Link>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <Spinner />
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Card key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold text-ink">{s.name}</p>
                <p className="text-xs text-muted">
                  {format(new Date(s.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })} · código{' '}
                  {s.access_code}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  tone={
                    s.status === 'finished'
                      ? 'slate'
                      : s.status === 'draft'
                        ? 'yellow'
                        : 'green'
                  }
                >
                  {STATUS_LABEL[s.status]}
                </Badge>
                <Link to={`/admin/sessoes/${s.id}`}>
                  <Button size="sm" variant="secondary">
                    Abrir
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
          {sessions.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">Nenhuma sessão ainda.</p>
          )}
        </div>
      )}
    </PageShell>
  )
}
