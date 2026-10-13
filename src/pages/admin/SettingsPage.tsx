import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrandHeader, Button, Card, PageShell } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { isSupabaseConfigured } from '../../lib/supabase'

export function SettingsPage() {
  const { user, signOut } = useAuth()

  return (
    <PageShell className="max-w-2xl">
      <Link to="/admin" className="mb-2 inline-flex items-center gap-1 text-sm text-bayer-blue">
        <ArrowLeft size={14} /> Voltar
      </Link>
      <BrandHeader compact />
      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-bold text-ink">Configurações</h2>
        <div>
          <p className="text-sm text-muted">Administrador</p>
          <p className="font-semibold">{user?.email}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Supabase</p>
          <p className="font-semibold">
            {isSupabaseConfigured ? 'Configurado' : 'Pendente (.env)'}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 text-sm text-muted">
          <p className="font-semibold text-ink">Links úteis</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Participantes: <code className="text-bayer-blue">/play</code>
            </li>
            <li>
              Ranking tela: <code className="text-bayer-blue">/ranking</code>
            </li>
            <li>
              Histórico: <code className="text-bayer-blue">/historico</code>
            </li>
          </ul>
          <p className="mt-3">
            Nunca exponha a chave <strong>service_role</strong> no frontend. Use apenas a chave{' '}
            <strong>anon</strong>.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void signOut()}>
          Sair
        </Button>
      </Card>
    </PageShell>
  )
}
