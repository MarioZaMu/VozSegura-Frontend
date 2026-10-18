import { useParams } from 'react-router'

export function ContactAlertView() {
  const { alertId } = useParams()

  return (
    <section className="grid h-full place-items-center text-center">
      <div>
        <h1 className="text-2xl font-semibold">Alerta</h1>
        <p className="text-text-secondary">ID: {alertId}</p>
      </div>
    </section>
  )
}
