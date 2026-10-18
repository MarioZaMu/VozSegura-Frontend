import { Bell, MapPin, Mic, ShieldCheck, Trash2, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Logo } from '../../components/ui/Logo'
import { ProgressRing } from '../../components/ui/ProgressRing'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { WatchDevice } from '../../components/watch/WatchDevice'
import { watchShapeLabels, type WatchShape } from '../../components/watch/watchShape'

type ColorToken = { name: string; hex: string; swatch: string }

const brandColors: ColorToken[] = [
  { name: 'Fondo', hex: '#0B0613', swatch: 'bg-background' },
  { name: 'Superficie', hex: '#1A1225', swatch: 'bg-surface' },
  { name: 'Superficie elevada', hex: '#2A2236', swatch: 'bg-surface-raised' },
  { name: 'Primario', hex: '#C026D3', swatch: 'bg-primary' },
  { name: 'Degradado', hex: '#D946EF → #8B5CF6', swatch: 'bg-brand-gradient' },
  { name: 'Texto principal', hex: '#FFFFFF', swatch: 'bg-text-primary' },
  { name: 'Texto secundario', hex: '#9A93A8', swatch: 'bg-text-secondary' },
  { name: 'Peligro', hex: '#E53935', swatch: 'bg-danger' },
  { name: 'Éxito', hex: '#4ADE80', swatch: 'bg-success' },
  { name: 'Aviso', hex: '#FBBF24', swatch: 'bg-warning' },
]

const watchColors: ColorToken[] = [
  { name: 'Carátula', hex: '#000000', swatch: 'bg-watch-face' },
  { name: 'Texto', hex: '#F2F2F2', swatch: 'bg-watch-text' },
  { name: 'Texto tenue', hex: '#8E8E93', swatch: 'bg-watch-muted' },
  { name: 'Pista', hex: '#2C2C2E', swatch: 'bg-watch-track' },
  { name: 'Actividad', hex: '#8FD19E', swatch: 'bg-watch-activity' },
]

const typeScale = [
  { token: 'display · bold', sample: '8.432', className: 'text-display font-bold' },
  { token: 'headline · semibold', sample: 'Contactos de confianza', className: 'text-headline font-semibold' },
  { token: 'title · semibold', sample: 'Historial de alertas', className: 'text-title font-semibold' },
  { token: 'body', sample: 'La alerta se envía aunque la IA no responda.', className: 'text-body' },
  { token: 'body-sm', sample: 'Última alerta hace 2 días', className: 'text-body-sm text-text-secondary' },
  { token: 'caption', sample: 'UBICACIÓN COMPARTIDA', className: 'text-caption font-medium tracking-wide text-text-secondary' },
]

const shapeOptions = (Object.keys(watchShapeLabels) as WatchShape[]).map((value) => ({
  value,
  label: watchShapeLabels[value],
}))

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-caption font-semibold tracking-widest text-text-secondary uppercase">{title}</h2>
      {children}
    </section>
  )
}

function Swatches({ colors }: { colors: ColorToken[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {colors.map((color) => (
        <div key={color.name} className="rounded-lg bg-surface p-2">
          <div className={`h-16 rounded-md ring-1 ring-surface-raised ${color.swatch}`} />
          <p className="mt-2 text-body-sm font-medium">{color.name}</p>
          <p className="text-caption text-text-secondary">{color.hex}</p>
        </div>
      ))}
    </div>
  )
}

// Living style guide: every token and base component in one page (also used in the case study).
export function DesignSystemView() {
  const [shape, setShape] = useState<WatchShape>('round')

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-section px-gutter pb-section animate-screen-in">
      <header>
        <h1 className="text-headline font-bold">
          Sistema de diseño <span className="text-brand-gradient">Voz Segura</span>
        </h1>
        <p className="mt-1 text-body-sm text-text-secondary">
          Tokens y componentes base. Los acentos fuertes solo se usan en Configuración y Contacto.
        </p>
      </header>

      <Section title="Logo">
        <div className="flex flex-wrap items-center gap-6 rounded-lg bg-surface p-6">
          <Logo />
          <Logo variant="mark" />
          <img src="/icon-192.png" alt="Ícono de la app" className="size-16 rounded-lg" />
        </div>
      </Section>

      <Section title="Color · marca">
        <Swatches colors={brandColors} />
      </Section>

      <Section title="Color · carátula (neutra, no delata la función)">
        <Swatches colors={watchColors} />
      </Section>

      <Section title="Tipografía · Poppins">
        <Card className="flex flex-col gap-4">
          {typeScale.map((item) => (
            <div key={item.token} className="flex flex-col gap-1">
              <span className="text-caption text-text-secondary">{item.token}</span>
              <span className={item.className}>{item.sample}</span>
            </div>
          ))}
        </Card>
      </Section>

      <Section title="Botones">
        <div className="flex flex-wrap gap-3">
          <Button icon={<ShieldCheck size={18} />}>Guardar</Button>
          <Button variant="secondary" icon={<Mic size={18} />}>
            Practicar gesto
          </Button>
          <Button variant="danger" icon={<X size={18} />}>
            Cancelar alerta
          </Button>
          <Button variant="ghost" icon={<Trash2 size={18} />}>
            Eliminar
          </Button>
          <Button disabled>Deshabilitado</Button>
        </div>
      </Section>

      <Section title="Tarjetas y anillos">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card title="Contactos" icon={<Bell size={20} />}>
            <p className="text-body-sm text-text-secondary">3 contactos recibirán la alerta por Telegram.</p>
          </Card>
          <Card raised title="Ubicación" icon={<MapPin size={20} />}>
            <p className="text-body-sm text-text-secondary">Precisión de 12 m · hace 5 s</p>
          </Card>
          <Card className="flex items-center justify-around">
            <ProgressRing value={0.72} className="size-32" label="Resumen generado">
              <span className="text-headline font-bold">72%</span>
            </ProgressRing>
            <ProgressRing value={0.35} tone="danger" thickness={8} className="size-20" label="Tiempo para cancelar" />
          </Card>
          <div className="flex items-center justify-center rounded-card bg-watch-face p-5 shadow-card">
            <ProgressRing value={0.64} tone="watch" thickness={8} className="size-28" label="Pasos">
              <span className="text-title font-semibold text-watch-text">6.432</span>
              <span className="block text-caption text-watch-muted">pasos</span>
            </ProgressRing>
          </div>
        </div>
      </Section>

      <Section title="Reloj">
        <SegmentedControl label="Forma del reloj" options={shapeOptions} value={shape} onChange={setShape} />
        <div className="flex justify-center py-6">
          <WatchDevice shape={shape}>
            <div className="grid size-full place-items-center text-center">
              <div>
                <p className="text-watch-time font-semibold tabular-nums">10:09</p>
                <p className="text-watch-date text-watch-muted">sáb 17 oct</p>
              </div>
            </div>
          </WatchDevice>
        </div>
      </Section>
    </div>
  )
}
