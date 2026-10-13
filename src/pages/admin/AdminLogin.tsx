import { useState, type FormEvent } from 'react'
import { BrandHeader, Button, Card, Input, Label, PageShell } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { isSupabaseConfigured } from '../../lib/supabase'

export function AdminLogin() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell className="flex max-w-md flex-col justify-center">
      <BrandHeader />
      <Card className="animate-rise p-6">
        <h2 className="text-lg font-bold text-ink">Acesso do administrador</h2>
        <p className="mt-1 text-sm text-muted">Use o usuário criado no Supabase Auth.</p>
        {!isSupabaseConfigured && (
          <p className="mt-3 rounded-xl bg-bayer-yellow/30 px-3 py-2 text-sm text-amber-900">
            Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env
          </p>
        )}
        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <div>
            <Label>E-mail</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <Label>Senha</Label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </Card>
    </PageShell>
  )
}
