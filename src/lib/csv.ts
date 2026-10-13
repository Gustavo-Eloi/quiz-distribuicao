import type { Difficulty, OptionKey, QuestionFormData } from './types'

function parseLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function escapeCell(value: string | number | boolean): string {
  const s = String(value ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function toCsv(headers: string[], rows: Array<Array<string | number | boolean>>): string {
  const lines = [headers.map(escapeCell).join(',')]
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(','))
  }
  return lines.join('\n')
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** CSV esperado: theme,difficulty,statement,option_a,option_b,option_c,option_d,correct_option,explanation,time_seconds,points_multiplier,tags */
export function parseQuestionsCsv(text: string): QuestionFormData[] {
  const lines = text
    .replace(/^\ufeff/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length < 2) throw new Error('CSV vazio ou sem dados')

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase())
  const idx = (name: string) => headers.indexOf(name)

  const required = [
    'theme',
    'difficulty',
    'statement',
    'option_a',
    'option_b',
    'option_c',
    'option_d',
    'correct_option',
  ]
  for (const r of required) {
    if (idx(r) < 0) throw new Error(`Coluna obrigatória ausente: ${r}`)
  }

  const questions: QuestionFormData[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i])
    const difficulty = (cols[idx('difficulty')] || 'medio').toLowerCase() as Difficulty
    const correct = (cols[idx('correct_option')] || 'A').toUpperCase() as OptionKey
    const tagsRaw = idx('tags') >= 0 ? cols[idx('tags')] || '' : ''

    questions.push({
      theme: cols[idx('theme')],
      difficulty: ['facil', 'medio', 'dificil'].includes(difficulty) ? difficulty : 'medio',
      statement: cols[idx('statement')],
      explanation: idx('explanation') >= 0 ? cols[idx('explanation')] || '' : '',
      time_seconds: Number(idx('time_seconds') >= 0 ? cols[idx('time_seconds')] || 20 : 20) || 20,
      points_multiplier:
        Number(idx('points_multiplier') >= 0 ? cols[idx('points_multiplier')] || 1 : 1) || 1,
      tags: tagsRaw
        ? tagsRaw
            .split(/[|;]/)
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      options: {
        A: cols[idx('option_a')],
        B: cols[idx('option_b')],
        C: cols[idx('option_c')],
        D: cols[idx('option_d')],
      },
      correct_option: (['A', 'B', 'C', 'D'] as OptionKey[]).includes(correct) ? correct : 'A',
    })
  }
  return questions
}
