import { Copy, Pencil, Archive, Trash2, Plus, Upload, Search, ArrowLeft } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, Input, Label, PageShell, Select, Spinner, TextArea } from '../../components/ui'
import {
  archiveQuestion,
  deleteQuestion,
  duplicateQuestion,
  fetchQuestions,
  saveQuestion,
} from '../../lib/api'
import { downloadCsv, parseQuestionsCsv, toCsv } from '../../lib/csv'
import { DIFFICULTY_LABEL, type Difficulty, type OptionKey, type QuestionFormData, type QuestionWithOptions } from '../../lib/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const emptyForm = (): QuestionFormData => ({
  theme: '',
  difficulty: 'medio',
  statement: '',
  explanation: '',
  time_seconds: 30,
  points_multiplier: 1,
  tags: [],
  options: { A: '', B: '', C: '', D: '' },
  correct_option: 'A',
})

export function QuestionBankPage() {
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [themeFilter, setThemeFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [diffFilter, setDiffFilter] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<QuestionFormData>(emptyForm())
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setQuestions(await fetchQuestions(true))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar perguntas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const themes = useMemo(
    () => [...new Set(questions.map((q) => q.theme))].sort(),
    [questions],
  )
  const allTags = useMemo(
    () => [...new Set(questions.flatMap((q) => q.tags || []))].sort(),
    [questions],
  )

  const filtered = questions.filter((q) => {
    if (!showArchived && q.archived) return false
    if (themeFilter && q.theme !== themeFilter) return false
    if (diffFilter && q.difficulty !== diffFilter) return false
    if (tagFilter && !(q.tags || []).includes(tagFilter)) return false
    if (search) {
      const s = search.toLowerCase()
      const hay = `${q.statement} ${q.theme} ${(q.tags || []).join(' ')}`.toLowerCase()
      if (!hay.includes(s)) return false
    }
    return true
  })

  const active = questions.filter((q) => !q.archived)
  const mostUsed = [...active].sort((a, b) => b.usage_count - a.usage_count).slice(0, 5)

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  const openEdit = (q: QuestionWithOptions) => {
    setEditingId(q.id)
    setForm({
      theme: q.theme,
      difficulty: q.difficulty,
      statement: q.statement,
      explanation: q.explanation,
      time_seconds: q.time_seconds,
      points_multiplier: Number(q.points_multiplier),
      tags: q.tags || [],
      options: {
        A: q.options.find((o) => o.option_key === 'A')?.option_text || '',
        B: q.options.find((o) => o.option_key === 'B')?.option_text || '',
        C: q.options.find((o) => o.option_key === 'C')?.option_text || '',
        D: q.options.find((o) => o.option_key === 'D')?.option_text || '',
      },
      correct_option: (q.options.find((o) => o.is_correct)?.option_key || 'A') as OptionKey,
    })
    setShowForm(true)
  }

  const onSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await saveQuestion(form, editingId || undefined)
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const onImportCsv = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = parseQuestionsCsv(text)
      for (const item of parsed) {
        await saveQuestion(item)
      }
      await load()
      alert(`${parsed.length} pergunta(s) importada(s).`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha na importação')
    }
  }

  const exportTemplate = () => {
    const csv = toCsv(
      [
        'theme',
        'difficulty',
        'statement',
        'option_a',
        'option_b',
        'option_c',
        'option_d',
        'correct_option',
        'explanation',
        'time_seconds',
        'points_multiplier',
        'tags',
      ],
      [
        [
          'Automação',
          'facil',
          'Exemplo de enunciado?',
          'Alt A',
          'Alt B',
          'Alt C',
          'Alt D',
          'B',
          'Explicação',
          30,
          1,
          'armazem|ia',
        ],
      ],
    )
    downloadCsv('modelo-perguntas.csv', csv)
  }

  return (
    <PageShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin" className="mb-2 inline-flex items-center gap-1 text-sm text-bayer-blue">
            <ArrowLeft size={14} /> Voltar
          </Link>
          <h1 className="text-2xl font-bold text-bayer-blue">Banco de perguntas</h1>
          <p className="text-sm text-muted">Perguntas permanentes — nunca apagadas automaticamente.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={exportTemplate}>
            Modelo CSV
          </Button>
          <label className="inline-flex cursor-pointer">
            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50">
              <Upload size={14} /> Importar CSV
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onImportCsv(f)
                e.target.value = ''
              }}
            />
          </label>
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} /> Nova pergunta
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-muted">Total</p>
          <p className="mt-1 text-2xl font-bold text-bayer-blue">{active.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-muted">Temas</p>
          <p className="mt-1 text-2xl font-bold text-bayer-blue">{themes.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-muted">Mais utilizadas</p>
          <p className="mt-1 truncate text-sm font-semibold text-ink">
            {mostUsed[0]?.statement.slice(0, 48) || '—'}
            {mostUsed[0] ? '…' : ''}
          </p>
          <p className="text-xs text-muted">{mostUsed[0]?.usage_count || 0} usos</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-muted">Última utilização</p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {active
              .filter((q) => q.last_used_at)
              .sort((a, b) => (b.last_used_at || '').localeCompare(a.last_used_at || ''))[0]
              ?.last_used_at
              ? format(
                  new Date(
                    active
                      .filter((q) => q.last_used_at)
                      .sort((a, b) => (b.last_used_at || '').localeCompare(a.last_used_at || ''))[0]
                      .last_used_at!,
                  ),
                  "dd/MM/yyyy HH:mm",
                  { locale: ptBR },
                )
              : 'Ainda não usadas'}
          </p>
        </Card>
      </div>

      <Card className="mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Pesquisar enunciado, tema ou tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={themeFilter} onChange={(e) => setThemeFilter(e.target.value)}>
            <option value="">Todos os temas</option>
            {themes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select value={diffFilter} onChange={(e) => setDiffFilter(e.target.value)}>
            <option value="">Todas as dificuldades</option>
            <option value="facil">Fácil</option>
            <option value="medio">Médio</option>
            <option value="dificil">Difícil</option>
          </Select>
          <Select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
            <option value="">Todas as tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Mostrar arquivadas
          </label>
        </div>
      </Card>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {loading ? (
        <Spinner />
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <Card key={q.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge>{q.theme}</Badge>
                    <Badge tone="slate">{DIFFICULTY_LABEL[q.difficulty]}</Badge>
                    {Number(q.points_multiplier) > 1 && (
                      <Badge tone="yellow">{q.points_multiplier}x</Badge>
                    )}
                    {q.archived && <Badge tone="red">Arquivada</Badge>}
                  </div>
                  <p className="font-semibold text-ink">{q.statement}</p>
                  <p className="mt-2 text-xs text-muted">
                    {q.time_seconds}s · {q.usage_count} usos · criada em{' '}
                    {format(new Date(q.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    {q.last_used_at
                      ? ` · última uso ${format(new Date(q.last_used_at), 'dd/MM/yyyy', { locale: ptBR })}`
                      : ''}
                  </p>
                  {(q.tags || []).length > 0 && (
                    <p className="mt-1 text-xs text-muted">Tags: {(q.tags || []).join(', ')}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(q)} title="Editar">
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void duplicateQuestion(q.id).then(load)}
                    title="Duplicar"
                  >
                    <Copy size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void archiveQuestion(q.id, !q.archived).then(load)}
                    title={q.archived ? 'Desarquivar' : 'Arquivar'}
                  >
                    <Archive size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Excluir permanentemente esta pergunta?')) {
                        void deleteQuestion(q.id).then(load)
                      }
                    }}
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">Nenhuma pergunta encontrada.</p>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5">
            <h2 className="text-lg font-bold text-ink">
              {editingId ? 'Editar pergunta' : 'Nova pergunta'}
            </h2>
            <form className="mt-4 space-y-3" onSubmit={onSave}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Tema</Label>
                  <Input
                    required
                    value={form.theme}
                    onChange={(e) => setForm({ ...form, theme: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Dificuldade</Label>
                  <Select
                    value={form.difficulty}
                    onChange={(e) =>
                      setForm({ ...form, difficulty: e.target.value as Difficulty })
                    }
                  >
                    <option value="facil">Fácil</option>
                    <option value="medio">Médio</option>
                    <option value="dificil">Difícil</option>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Enunciado</Label>
                <TextArea
                  required
                  rows={3}
                  value={form.statement}
                  onChange={(e) => setForm({ ...form, statement: e.target.value })}
                />
              </div>
              {(['A', 'B', 'C', 'D'] as OptionKey[]).map((key) => (
                <div key={key}>
                  <Label>Alternativa {key}</Label>
                  <Input
                    required
                    value={form.options[key]}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        options: { ...form.options, [key]: e.target.value },
                      })
                    }
                  />
                </div>
              ))}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label>Correta</Label>
                  <Select
                    value={form.correct_option}
                    onChange={(e) =>
                      setForm({ ...form, correct_option: e.target.value as OptionKey })
                    }
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </Select>
                </div>
                <div>
                  <Label>Tempo (s)</Label>
                  <Input
                    type="number"
                    min={5}
                    max={300}
                    required
                    value={form.time_seconds}
                    onChange={(e) =>
                      setForm({ ...form, time_seconds: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label>Multiplicador</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min={0.1}
                    required
                    value={form.points_multiplier}
                    onChange={(e) =>
                      setForm({ ...form, points_multiplier: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Explicação</Label>
                <TextArea
                  rows={2}
                  value={form.explanation}
                  onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                />
              </div>
              <div>
                <Label>Tags (separadas por vírgula)</Label>
                <Input
                  value={form.tags.join(', ')}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tags: e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Salvando…' : 'Salvar'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </PageShell>
  )
}
