import { QRCodeSVG } from 'qrcode.react'
import { getPlayUrl } from '../lib/storage'
import { Button, Card } from './ui'

export function QRPanel({ sessionId, accessCode }: { sessionId: string; accessCode: string }) {
  const url = getPlayUrl(sessionId)

  return (
    <Card className="p-5">
      <h3 className="font-bold text-bayer-blue">Acesso dos participantes</h3>
      <p className="mt-1 text-sm text-muted">Escaneie o QR Code ou compartilhe o link.</p>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <QRCodeSVG value={url} size={160} level="M" />
        </div>
        <div className="flex-1 space-y-3 text-sm">
          <div>
            <p className="text-muted">Código da sessão</p>
            <p className="text-2xl font-bold tracking-widest text-bayer-blue">{accessCode}</p>
          </div>
          <div>
            <p className="text-muted">Link público</p>
            <p className="break-all font-medium text-ink">{url}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => navigator.clipboard.writeText(url)}
          >
            Copiar link
          </Button>
        </div>
      </div>
    </Card>
  )
}
