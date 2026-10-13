const TOKEN_KEY = 'dac_client_token'
const PARTICIPANT_KEY = 'dac_participant'

function randomToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export function getClientToken(): string {
  let token = localStorage.getItem(TOKEN_KEY)
  if (!token) {
    token = randomToken()
    localStorage.setItem(TOKEN_KEY, token)
  }
  return token
}

export interface StoredParticipant {
  id: string
  sessionId: string
  nickname: string
  clientToken: string
}

export function saveParticipant(p: StoredParticipant) {
  localStorage.setItem(PARTICIPANT_KEY, JSON.stringify(p))
}

export function loadParticipant(): StoredParticipant | null {
  const raw = localStorage.getItem(PARTICIPANT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredParticipant
  } catch {
    return null
  }
}

export function clearParticipant() {
  localStorage.removeItem(PARTICIPANT_KEY)
}

export function getPlayUrl(sessionId?: string): string {
  const base = `${window.location.origin}/play`
  return sessionId ? `${base}?session=${sessionId}` : base
}
