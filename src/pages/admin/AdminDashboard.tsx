import {
  BookOpen,
  History,
  PlayCircle,
  Settings,
  LogOut,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrandHeader, Button, Card, PageShell } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'

const tiles = [
  {
    to: '/admin/sessoes/nova',
    title: 'Criar sessão',
    description: 'Monte um quiz com 5 a 15 perguntas do banco.',
    icon: PlayCircle,
  },
  {
    to: '/admin/perguntas',
    title: 'Banco de perguntas',
    description: 'Criar, editar, importar CSV e analisar indicadores.',
    icon: BookOpen,
  },
  {
    to: '/historico',
    title: 'Histórico',
    description: 'Sessões concluídas, rankings e exportação CSV.',
    icon: History,
  },
  {
    to: '/admin/configuracoes',
    title: 'Configurações',
    description: 'Conta, links e orientações de publicação.',
    icon: Settings,
  },
]

export function AdminDashboard() {
  const { user, signOut } = useAuth()

  return (
    <PageShell>
      <div className="mb-2 flex items-start justify-between gap-3">
        <BrandHeader />
        <Button variant="ghost" size="sm" onClick={() => signOut()} className="mt-2 shrink-0">
          <LogOut size={16} /> Sair
        </Button>
      </div>
      <p className="mb-6 text-sm text-muted">
        Olá, <span className="font-semibold text-ink">{user?.email}</span>
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map((tile) => (
          <Link key={tile.to} to={tile.to} className="group">
            <Card className="h-full p-5 transition group-hover:border-bayer-cyan/40 group-hover:shadow-md">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-bayer-blue/10 text-bayer-blue">
                <tile.icon size={20} />
              </div>
              <h2 className="text-lg font-bold text-ink">{tile.title}</h2>
              <p className="mt-1 text-sm text-muted">{tile.description}</p>
            </Card>
          </Link>
        ))}
      </div>
      <div className="mt-6">
        <Link to="/admin/sessoes">
          <Button variant="secondary">Ver sessões e controlar jogo ao vivo</Button>
        </Link>
      </div>
    </PageShell>
  )
}
