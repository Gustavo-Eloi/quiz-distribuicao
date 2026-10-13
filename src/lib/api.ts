import { supabase } from './supabase'
import type {
  Answer,
  OptionKey,
  Participant,
  QuestionBank,
  QuestionFormData,
  QuestionOption,
  QuestionWithOptions,
  QuizSession,
  ScoreSnapshot,
  SessionQuestion,
  SessionStatus,
} from './types'

export async function fetchQuestions(includeArchived = false): Promise<QuestionWithOptions[]> {
  let query = supabase
    .from('question_bank')
    .select('*, question_options(*)')
    .order('created_at', { ascending: false })

  if (!includeArchived) {
    query = query.eq('archived', false)
  }

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((q) => {
    const row = q as QuestionBank & { question_options: QuestionOption[] }
    return {
      ...row,
      options: (row.question_options || []).sort((a, b) =>
        a.option_key.localeCompare(b.option_key),
      ),
    }
  })
}

export async function saveQuestion(
  form: QuestionFormData,
  existingId?: string,
): Promise<string> {
  const payload = {
    theme: form.theme,
    difficulty: form.difficulty,
    statement: form.statement,
    explanation: form.explanation,
    time_seconds: form.time_seconds,
    points_multiplier: form.points_multiplier,
    tags: form.tags,
  }

  let questionId = existingId

  if (existingId) {
    const { error } = await supabase.from('question_bank').update(payload).eq('id', existingId)
    if (error) throw error
    await supabase.from('question_options').delete().eq('question_id', existingId)
  } else {
    const { data, error } = await supabase.from('question_bank').insert(payload).select('id').single()
    if (error) throw error
    questionId = data.id
  }

  const options = (['A', 'B', 'C', 'D'] as OptionKey[]).map((key) => ({
    question_id: questionId!,
    option_key: key,
    option_text: form.options[key],
    is_correct: form.correct_option === key,
  }))

  const { error: optError } = await supabase.from('question_options').insert(options)
  if (optError) throw optError

  return questionId!
}

export async function duplicateQuestion(id: string): Promise<void> {
  const questions = await fetchQuestions(true)
  const q = questions.find((x) => x.id === id)
  if (!q) throw new Error('Pergunta não encontrada')

  const correct = q.options.find((o) => o.is_correct)?.option_key || 'A'
  await saveQuestion({
    theme: q.theme,
    difficulty: q.difficulty,
    statement: `${q.statement} (cópia)`,
    explanation: q.explanation,
    time_seconds: q.time_seconds,
    points_multiplier: Number(q.points_multiplier),
    tags: q.tags,
    options: {
      A: q.options.find((o) => o.option_key === 'A')?.option_text || '',
      B: q.options.find((o) => o.option_key === 'B')?.option_text || '',
      C: q.options.find((o) => o.option_key === 'C')?.option_text || '',
      D: q.options.find((o) => o.option_key === 'D')?.option_text || '',
    },
    correct_option: correct,
  })
}

export async function archiveQuestion(id: string, archived = true) {
  const { error } = await supabase.from('question_bank').update({ archived }).eq('id', id)
  if (error) throw error
}

export async function deleteQuestion(id: string) {
  const { error } = await supabase.from('question_bank').delete().eq('id', id)
  if (error) throw error
}

export async function createSession(
  name: string,
  questionIds: string[],
): Promise<QuizSession> {
  if (questionIds.length < 5 || questionIds.length > 15) {
    throw new Error('Selecione de 5 a 15 perguntas')
  }

  const questions = await fetchQuestions(true)
  const selected = questionIds.map((id) => {
    const q = questions.find((x) => x.id === id)
    if (!q) throw new Error(`Pergunta ${id} não encontrada`)
    return q
  })

  const { data: session, error } = await supabase
    .from('quiz_sessions')
    .insert({ name, status: 'draft' })
    .select('*')
    .single()
  if (error) throw error

  const rows = selected.map((q, index) => {
    const correct = q.options.find((o) => o.is_correct)?.option_key || 'A'
    return {
      session_id: session.id,
      question_bank_id: q.id,
      order_index: index + 1,
      theme: q.theme,
      difficulty: q.difficulty,
      statement: q.statement,
      explanation: q.explanation,
      time_seconds: q.time_seconds,
      points_multiplier: Number(q.points_multiplier),
      tags: q.tags,
      option_a: q.options.find((o) => o.option_key === 'A')?.option_text || '',
      option_b: q.options.find((o) => o.option_key === 'B')?.option_text || '',
      option_c: q.options.find((o) => o.option_key === 'C')?.option_text || '',
      option_d: q.options.find((o) => o.option_key === 'D')?.option_text || '',
      correct_option: correct,
    }
  })

  const { error: sqError } = await supabase.from('session_questions').insert(rows)
  if (sqError) throw sqError

  for (const id of questionIds) {
    const q = questions.find((x) => x.id === id)
    if (!q) continue
    await supabase
      .from('question_bank')
      .update({
        usage_count: (q.usage_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', id)
  }

  return session as QuizSession
}

export async function updateSessionStatus(
  sessionId: string,
  patch: Partial<QuizSession>,
) {
  const { data, error } = await supabase
    .from('quiz_sessions')
    .update(patch)
    .eq('id', sessionId)
    .select('*')
    .single()
  if (error) throw error
  return data as QuizSession
}

export async function fetchSession(sessionId: string): Promise<QuizSession | null> {
  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle()
  if (error) throw error
  return data as QuizSession | null
}

export async function fetchActiveOrLobbySession(): Promise<QuizSession | null> {
  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('*')
    .in('status', ['lobby', 'active', 'question_open', 'question_closed', 'revealing', 'ranking'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as QuizSession | null
}

export async function fetchSessionQuestions(sessionId: string): Promise<SessionQuestion[]> {
  const { data, error } = await supabase
    .from('session_questions')
    .select('*')
    .eq('session_id', sessionId)
    .order('order_index', { ascending: true })
  if (error) throw error
  return (data || []) as SessionQuestion[]
}

export async function fetchParticipants(sessionId: string): Promise<Participant[]> {
  // Preferência: RPC pública (sem client_token). Admin autenticado também pode usar a tabela.
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_leaderboard', {
    p_session_id: sessionId,
  })
  if (!rpcError && rpcData) {
    return (rpcData as Participant[]).map((p) => ({
      ...p,
      client_token: '',
    }))
  }

  const { data, error } = await supabase
    .from('participants')
    .select('id, session_id, nickname, total_score, correct_count, total_response_ms, is_connected, created_at')
    .eq('session_id', sessionId)
    .order('total_score', { ascending: false })
  if (error) throw error
  return (data || []).map((p) => ({ ...p, client_token: '' })) as Participant[]
}

export async function fetchOwnParticipant(
  sessionId: string,
  clientToken: string,
): Promise<Participant | null> {
  const { data, error } = await supabase.rpc('get_own_participant', {
    p_session_id: sessionId,
    p_client_token: clientToken,
  })
  if (error) throw error
  return (data as Participant | null) ?? null
}

export async function fetchAnswerCount(sessionQuestionId: string): Promise<number> {
  const { count, error } = await supabase
    .from('answers')
    .select('*', { count: 'exact', head: true })
    .eq('session_question_id', sessionQuestionId)
  if (error) throw error
  return count || 0
}

export async function fetchAnswersForQuestion(sessionQuestionId: string): Promise<Answer[]> {
  const { data, error } = await supabase
    .from('answers')
    .select('*')
    .eq('session_question_id', sessionQuestionId)
  if (error) throw error
  return (data || []) as Answer[]
}

/** RPC pode devolver {} / campos nulos em vez de null — só aceita resposta real. */
function normalizeAnswer(data: unknown): Answer | null {
  if (!data || typeof data !== 'object') return null
  const row = data as Partial<Answer>
  if (!row.id || !row.session_question_id || !row.selected_option) return null
  const option = String(row.selected_option).trim().toUpperCase()
  if (!['A', 'B', 'C', 'D'].includes(option)) return null
  return { ...row, selected_option: option as OptionKey } as Answer
}

export async function fetchParticipantAnswer(
  participantId: string,
  clientToken: string,
  sessionQuestionId: string,
): Promise<Answer | null> {
  const { data, error } = await supabase.rpc('get_own_answer', {
    p_participant_id: participantId,
    p_client_token: clientToken,
    p_session_question_id: sessionQuestionId,
  })
  if (error) throw error
  const ans = normalizeAnswer(data)
  if (ans && ans.session_question_id !== sessionQuestionId) return null
  return ans
}

export async function joinSession(
  sessionId: string,
  nickname: string,
  clientToken: string,
): Promise<Participant> {
  const { data, error } = await supabase.rpc('join_session', {
    p_session_id: sessionId,
    p_nickname: nickname.trim(),
    p_client_token: clientToken,
  })
  if (error) throw error
  return data as Participant
}

export async function submitAnswer(
  participantId: string,
  clientToken: string,
  sessionQuestionId: string,
  selectedOption: OptionKey,
  responseTimeMs: number,
): Promise<Answer> {
  const { data, error } = await supabase.rpc('submit_answer', {
    p_participant_id: participantId,
    p_client_token: clientToken,
    p_session_question_id: sessionQuestionId,
    p_selected_option: selectedOption,
    p_response_time_ms: responseTimeMs,
  })
  if (error) throw error
  const ans = normalizeAnswer(data)
  if (!ans) throw new Error('Resposta não confirmada pelo servidor')
  return ans
}

export async function refreshSnapshots(sessionId: string, type: 'live' | 'final' = 'live') {
  const { error } = await supabase.rpc('refresh_score_snapshots', {
    p_session_id: sessionId,
    p_snapshot_type: type,
  })
  if (error) throw error
}

export async function fetchSnapshots(
  sessionId: string,
  type: 'live' | 'final' = 'live',
): Promise<ScoreSnapshot[]> {
  const { data, error } = await supabase
    .from('score_snapshots')
    .select('*')
    .eq('session_id', sessionId)
    .eq('snapshot_type', type)
    .order('rank_position', { ascending: true })
  if (error) throw error
  return (data || []) as ScoreSnapshot[]
}

export async function fetchSessions(): Promise<QuizSession[]> {
  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []) as QuizSession[]
}

export async function openQuestion(sessionId: string, orderIndex: number) {
  const questions = await fetchSessionQuestions(sessionId)
  const q = questions.find((x) => x.order_index === orderIndex)
  if (!q) throw new Error('Pergunta não encontrada')

  await supabase
    .from('session_questions')
    .update({ opened_at: new Date().toISOString(), closed_at: null, answer_revealed: false })
    .eq('id', q.id)

  return updateSessionStatus(sessionId, {
    status: 'question_open' as SessionStatus,
    current_question_order: orderIndex,
    show_answer: false,
    show_ranking: false,
  })
}

export async function closeAnswers(sessionId: string) {
  const session = await fetchSession(sessionId)
  if (!session) throw new Error('Sessão não encontrada')
  const questions = await fetchSessionQuestions(sessionId)
  const q = questions.find((x) => x.order_index === session.current_question_order)
  if (q) {
    await supabase
      .from('session_questions')
      .update({ closed_at: new Date().toISOString() })
      .eq('id', q.id)
  }
  await refreshSnapshots(sessionId, 'live')
  return updateSessionStatus(sessionId, { status: 'question_closed', show_answer: false })
}

export async function revealAnswer(sessionId: string) {
  const session = await fetchSession(sessionId)
  if (!session) throw new Error('Sessão não encontrada')
  const questions = await fetchSessionQuestions(sessionId)
  const q = questions.find((x) => x.order_index === session.current_question_order)
  if (q) {
    await supabase
      .from('session_questions')
      .update({ answer_revealed: true })
      .eq('id', q.id)
  }
  await refreshSnapshots(sessionId, 'live')
  return updateSessionStatus(sessionId, { status: 'revealing', show_answer: true })
}

export async function showRanking(sessionId: string) {
  await refreshSnapshots(sessionId, 'live')
  return updateSessionStatus(sessionId, { status: 'ranking', show_ranking: true })
}

export async function advanceQuestion(sessionId: string) {
  const session = await fetchSession(sessionId)
  if (!session) throw new Error('Sessão não encontrada')
  const questions = await fetchSessionQuestions(sessionId)
  const next = session.current_question_order + 1
  if (next > questions.length) {
    return finishSession(sessionId)
  }
  return openQuestion(sessionId, next)
}

export async function startSession(sessionId: string) {
  await updateSessionStatus(sessionId, {
    status: 'lobby',
    started_at: new Date().toISOString(),
    current_question_order: 0,
    show_answer: false,
    show_ranking: false,
  })
}

export async function beginQuiz(sessionId: string) {
  return openQuestion(sessionId, 1)
}

export async function finishSession(sessionId: string) {
  await refreshSnapshots(sessionId, 'final')
  await refreshSnapshots(sessionId, 'live')
  return updateSessionStatus(sessionId, {
    status: 'finished',
    finished_at: new Date().toISOString(),
    show_ranking: true,
    show_answer: false,
  })
}

export async function fetchAllAnswers(sessionId: string): Promise<Answer[]> {
  const { data, error } = await supabase.from('answers').select('*').eq('session_id', sessionId)
  if (error) throw error
  return (data || []) as Answer[]
}
