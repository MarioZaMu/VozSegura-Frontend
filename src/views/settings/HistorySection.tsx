import { ChevronRight, History } from 'lucide-react'
import { Link } from 'react-router'
import { buildContactAlertPath } from '../../app/routes'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { clearAlertHistory, useAlertHistory, type AlertHistoryEntry } from '../../features/alert/alertHistory'
import { formatDateTime } from '../../lib/formatDate'

const kindLabels: Record<AlertHistoryEntry['kind'], string> = {
  demo: 'Demo (no se envió)',
  web: 'Navegador',
  native: 'App',
}

// Alerts raised on this device; each opens the same page the contacts see.
export function HistorySection() {
  const history = useAlertHistory()

  return (
    <Card title="Historial de alertas" icon={<History size={20} />} className="flex flex-col gap-3">
      {history.length === 0 ? (
        <p className="text-body-sm text-text-secondary">Aún no has activado ninguna alerta en este dispositivo.</p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {history.map((entry) => (
              <li key={entry.alertId}>
                <Link
                  to={buildContactAlertPath(entry.alertId)}
                  className="flex min-h-touch items-center justify-between gap-3 rounded-lg bg-surface-raised/50 px-4 py-3 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <span>
                    <span className="block text-body-sm font-medium">{formatDateTime(new Date(entry.startedAt))}</span>
                    <span className="block text-caption text-text-secondary">
                      {entry.kind === 'demo' ? kindLabels.demo : `${kindLabels[entry.kind]} · ${entry.delivered ? 'enviada' : 'sin envío'}`}
                    </span>
                  </span>
                  <ChevronRight size={18} className="text-text-secondary" />
                </Link>
              </li>
            ))}
          </ul>
          <Button variant="ghost" onClick={clearAlertHistory} className="self-start">
            Borrar historial
          </Button>
        </>
      )}
    </Card>
  )
}
