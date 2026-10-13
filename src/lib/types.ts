export type Difficulty = 'facil' | 'medio' | 'dificil'
export type OptionKey = 'A' | 'B' | 'C' | 'D'

export type SessionStatus =
  | 'draft'
  | 'lobby'
  | 'active'
  | 'question_open'
  | 'question_closed'
  | 'revealing'
  | 'ranking'
  | 'finished'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: 'admin'
  created_at: string
}

export interface QuestionBank {
  id: string
  theme: string
  difficulty: Difficulty
  statement: string
  explanation: string
  time_seconds: number
  points_multiplier: number
  tags: string[]
  archived: boolean
  usage_count: number
  last_used_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface QuestionOption {
  id: string
  question_id: string
  option_key: OptionKey
  option_text: string
  is_correct: boolean
}

export interface QuestionWithOptions extends QuestionBank {
  options: QuestionOption[]
}

export interface QuizSession {
  id: string
  name: string
  status: SessionStatus
  current_question_order: number
  show_answer: boolean
  show_ranking: boolean
  access_code: string
  created_by: string | null
  started_at: string | null
  finished_at: string | null
  settings: Record<string, unknown>
  created_at: string
}

export interface SessionQuestion {
  id: string
  session_id: string
  question_bank_id: string | null
  order_index: number
  theme: string
  difficulty: Difficulty
  statement: string
  explanation: string
  time_seconds: number
  points_multiplier: number
  tags: string[]
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: OptionKey
  opened_at: string | null
  closed_at: string | null
  answer_revealed: boolean
}

export interface Participant {
  id: string
  session_id: string
  nickname: string
  client_token: string
  total_score: number
  correct_count: number
  total_response_ms: number
  is_connected: boolean
  created_at: string
}

export interface Answer {
  id: string
  session_id: string
  session_question_id: string
  participant_id: string
  selected_option: OptionKey
  is_correct: boolean
  response_time_ms: number
  points_awarded: number
  created_at: string
}

export interface ScoreSnapshot {
  id: string
  session_id: string
  participant_id: string
  nickname: string
  rank_position: number
  total_score: number
  correct_count: number
  total_response_ms: number
  snapshot_type: 'live' | 'final'
  created_at: string
}

export interface QuestionFormData {
  theme: string
  difficulty: Difficulty
  statement: string
  explanation: string
  time_seconds: number
  points_multiplier: number
  tags: string[]
  options: { A: string; B: string; C: string; D: string }
  correct_option: OptionKey
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
}

export const STATUS_LABEL: Record<SessionStatus, string> = {
  draft: 'Rascunho',
  lobby: 'Lobby',
  active: 'Ativa',
  question_open: 'Pergunta aberta',
  question_closed: 'Respostas encerradas',
  revealing: 'Gabarito',
  ranking: 'Ranking',
  finished: 'Encerrada',
}
