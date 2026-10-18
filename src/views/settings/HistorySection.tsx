import { ChevronRight, History } from 'lucide-react'
import { Link } from 'react-router'
import { buildContactAlertPath } from '../../app/routes'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { clearAlertHistory, useAlertHistory } from '../../features/alert/alertHistory'
import { useLanguage, useT } from '../../i18n/useT'
import { formatDateTime } from '../../lib/formatDate'

// Alerts raised on this device; each opens the same page the contacts see.
export function HistorySection() {
  const t = useT().history
  const language = useLanguage()
  const history = useAlertHistory()

  return (
    <Card title={t.title} icon={<History size={20} />} className="flex flex-col gap-3">
      {history.length === 0 ? (
        <p className="text-body-sm text-text-secondary">{t.empty}</p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {history.map((entry) => (
              <li key={entry.alertId}>
                <Link
                  to={buildContactAlertPath(entry.kind === 'demo' ? 'demo' : entry.alertId)}
                  className="flex min-h-touch items-center justify-between gap-3 rounded-lg bg-surface-raised/50 px-4 py-3 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <span>
                    <span className="block text-body-sm font-medium">{formatDateTime(new Date(entry.startedAt), language)}</span>
                    <span className="block text-caption text-text-secondary">
                      {entry.kind === 'demo' ? t.kinds.demo : `${t.kinds[entry.kind]} · ${entry.delivered ? t.sent : t.notSent}`}
                    </span>
                  </span>
                  <ChevronRight size={18} className="text-text-secondary" />
                </Link>
              </li>
            ))}
          </ul>
          <Button variant="ghost" onClick={clearAlertHistory} className="self-start">
            {t.clear}
          </Button>
        </>
      )}
    </Card>
  )
}
