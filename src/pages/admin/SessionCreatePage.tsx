import { ArrowLeft } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Card, Input, Label, PageShell, Spinner } from '../../components/ui'
import { createSession, fetchQuestions } from '../../lib/api'
import { DIFFICULTY_LABEL, type QuestionWithOptions } from '../../lib/types'

export function SessionCreatePage() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchQuestions(false)
      .then(setQuestions)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro'))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 15) return prev
      return [...prev, id]
    })
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (selected.length < 1 || selected.length > 15) {
      setError('Selecione de 1 a 15 perguntas.')
      return
    }
    setSaving(true)
    try {
      // Mantém a ordem de seleção
      const session = await createSession(name.trim(), selected)
      navigate(`/admin/sessoes/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar sessão')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell>
      <Link to="/admin" className="mb-2 inline-flex items-center gap-1 text-sm text-bayer-blue">
        <ArrowLeft size={14} /> Voltar
      </Link>
      <h1 className="mb-1 text-2xl font-bold text-bayer-blue">Criar sessão</h1>
      <p className="mb-6 text-sm text-muted">
        Selecione de 1 a 15 perguntas (as 7 oficiais duram 20s cada). Uma cópia será versionada na
        sessão.
      </p>

      {loading ? (
        <Spinner />
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Card className="p-4">
            <Label>Nome da sessão</Label>
            <Input
              required
              placeholder="Ex.: Quiz Distribuição — Outubro 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="mt-2 text-sm text-muted">
              Selecionadas: <strong>{selected.length}</strong> / 15
            </p>
          </Card>

          <div className="space-y-2">
            {questions.map((q) => {
              const checked = selected.includes(q.id)
              const order = selected.indexOf(q.id)
              return (
                <button
                  type="button"
                  key={q.id}
                  onClick={() => toggle(q.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    checked
                      ? 'border-bayer-green bg-bayer-green/10'
                      : 'border-slate-200 bg-white hover:border-bayer-cyan/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        checked ? 'bg-bayer-green text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {checked ? order + 1 : '+'}
                    </span>
                    <div>
                      <div className="mb-1 flex flex-wrap gap-2">
                        <Badge>{q.theme}</Badge>
                        <Badge tone="slate">{DIFFICULTY_LABEL[q.difficulty]}</Badge>
                        {Number(q.points_multiplier) > 1 && (
                          <Badge tone="yellow">{q.points_multiplier}x</Badge>
                        )}
                      </div>
                      <p className="font-medium text-ink">{q.statement}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={saving || selected.length < 1}>
            {saving ? 'Criando…' : 'Criar sessão'}
          </Button>
        </form>
      )}
    </PageShell>
  )
}
