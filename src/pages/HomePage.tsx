import { Link } from 'react-router-dom'
import { BrandHeader, Button, Card, PageShell } from '../components/ui'
import { isSupabaseConfigured } from '../lib/supabase'

export function HomePage() {
  return (
    <PageShell className="max-w-3xl">
      <BrandHeader />
      {!isSupabaseConfigured && (
        <Card className="mb-4 border border-amber-300 bg-amber-50">
          <p className="text-sm text-ink">
            Supabase não configurado. Defina <code>VITE_SUPABASE_URL</code> e{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> no Netlify (Environment variables).
          </p>
        </Card>
      )}
      <p className="mb-4 text-muted">Quem é você?</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="mb-1 text-lg font-bold text-bayer-blue">Participante</h2>
          <p className="mb-4 text-sm text-muted">Responder perguntas e disputar o ranking</p>
          <Link to="/play">
            <Button className="w-full">Entrar no jogo</Button>
          </Link>
        </Card>
        <Card>
          <h2 className="mb-1 text-lg font-bold text-bayer-blue">Apresentador</h2>
          <p className="mb-4 text-sm text-muted">Liberar perguntas, gabarito e QR Code</p>
          <Link to="/admin">
            <Button variant="secondary" className="w-full">
              Controlar o jogo
            </Button>
          </Link>
        </Card>
      </div>
      <div className="mt-4">
        <Link to="/ranking">
          <Button variant="ghost" className="w-full">
            Ver ranking / projetor
          </Button>
        </Link>
      </div>
    </PageShell>
  )
}
