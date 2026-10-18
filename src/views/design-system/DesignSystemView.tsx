import { Bell, MapPin, Mic, ShieldCheck, Trash2, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Logo } from '../../components/ui/Logo'
import { ProgressRing } from '../../components/ui/ProgressRing'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { WatchDevice } from '../../components/watch/WatchDevice'
import { watchShapes, type WatchShape } from '../../components/watch/watchShape'
import { useLanguage, useT } from '../../i18n/useT'
import { formatNumber, formatWatchDate } from '../../lib/formatDate'

type ColorToken = { hex: string; swatch: string }

// Dark-theme values; names come from the dictionaries in the same order.
const brandColors: ColorToken[] = [
  { hex: '#0B0613', swatch: 'bg-background' },
  { hex: '#1A1225', swatch: 'bg-surface' },
  { hex: '#2A2236', swatch: 'bg-surface-raised' },
  { hex: '#C026D3', swatch: 'bg-primary' },
  { hex: '#D946EF → #8B5CF6', swatch: 'bg-brand-gradient' },
  { hex: '#FFFFFF', swatch: 'bg-text-primary' },
  { hex: '#9A93A8', swatch: 'bg-text-secondary' },
  { hex: '#E53935', swatch: 'bg-danger' },
  { hex: '#4ADE80', swatch: 'bg-success' },
  { hex: '#FBBF24', swatch: 'bg-warning' },
]

const watchColors: ColorToken[] = [
  { hex: '#000000', swatch: 'bg-watch-face' },
  { hex: '#F2F2F2', swatch: 'bg-watch-text' },
  { hex: '#8E8E93', swatch: 'bg-watch-muted' },
  { hex: '#2C2C2E', swatch: 'bg-watch-track' },
  { hex: '#8FD19E', swatch: 'bg-watch-activity' },
]

const typeScale = [
  { token: 'display · bold', sample: 'display', className: 'text-display font-bold' },
  { token: 'headline · semibold', sample: 'headline', className: 'text-headline font-semibold' },
  { token: 'title · semibold', sample: 'title', className: 'text-title font-semibold' },
  { token: 'body', sample: 'body', className: 'text-body' },
  { token: 'body-sm', sample: 'bodySm', className: 'text-body-sm text-text-secondary' },
  { token: 'caption', sample: 'caption', className: 'text-caption font-medium tracking-wide text-text-secondary' },
] as const

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-caption font-semibold tracking-widest text-text-secondary uppercase">{title}</h2>
      {children}
    </section>
  )
}

function Swatches({ colors, names }: { colors: ColorToken[]; names: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {colors.map((color, index) => (
        <div key={color.swatch} className="rounded-lg bg-surface p-2">
          <div className={`h-16 rounded-md ring-1 ring-surface-raised ${color.swatch}`} />
          <p className="mt-2 text-body-sm font-medium">{names[index]}</p>
          <p className="text-caption text-text-secondary">{color.hex}</p>
        </div>
      ))}
    </div>
  )
}

// Living style guide: every token and base component in one page (also used in the case study).
export function DesignSystemView() {
  const t = useT()
  const d = t.designSystem
  const language = useLanguage()
  const [shape, setShape] = useState<WatchShape>('round')

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-section px-gutter pb-section animate-screen-in">
      <header>
        <h1 className="text-headline font-bold">
          {d.title} <span className="text-brand-gradient">Voz Segura</span>
        </h1>
        <p className="mt-1 text-body-sm text-text-secondary">
          {d.intro}
        </p>
      </header>

      <Section title={d.sections.logo}>
        <div className="flex flex-wrap items-center gap-6 rounded-lg bg-surface p-6">
          <Logo />
          <Logo variant="mark" />
          <img src="/icon-192.png" alt={d.appIcon} className="size-16 rounded-lg" />
        </div>
      </Section>

      <Section title={d.sections.brand}>
        <Swatches colors={brandColors} names={d.brandColors} />
      </Section>

      <Section title={d.sections.watch}>
        <Swatches colors={watchColors} names={d.watchColors} />
      </Section>

      <Section title={d.sections.type}>
        <Card className="flex flex-col gap-4">
          {typeScale.map((item) => (
            <div key={item.token} className="flex flex-col gap-1">
              <span className="text-caption text-text-secondary">{item.token}</span>
              <span className={item.className}>{item.sample === 'display' ? formatNumber(8432, language) : d.samples[item.sample]}</span>
            </div>
          ))}
        </Card>
      </Section>

      <Section title={d.sections.buttons}>
        <div className="flex flex-wrap gap-3">
          <Button icon={<ShieldCheck size={18} />}>{d.buttons.save}</Button>
          <Button variant="secondary" icon={<Mic size={18} />}>
            {d.buttons.practice}
          </Button>
          <Button variant="danger" icon={<X size={18} />}>
            {d.buttons.cancel}
          </Button>
          <Button variant="ghost" icon={<Trash2 size={18} />}>
            {d.buttons.remove}
          </Button>
          <Button disabled>{d.buttons.disabled}</Button>
        </div>
      </Section>

      <Section title={d.sections.cards}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card title={d.cards.contacts} icon={<Bell size={20} />}>
            <p className="text-body-sm text-text-secondary">{d.cards.contactsText}</p>
          </Card>
          <Card raised title={d.cards.location} icon={<MapPin size={20} />}>
            <p className="text-body-sm text-text-secondary">{d.cards.locationText}</p>
          </Card>
          <Card className="flex items-center justify-around">
            <ProgressRing value={0.72} className="size-32" label={d.cards.summaryRing}>
              <span className="text-headline font-bold">72%</span>
            </ProgressRing>
            <ProgressRing value={0.35} tone="danger" thickness={8} className="size-20" label={d.cards.cancelRing} />
          </Card>
          <div className="flex items-center justify-center rounded-card bg-watch-face p-5 shadow-card">
            <ProgressRing value={0.64} tone="watch" thickness={8} className="size-28" label={d.cards.steps}>
              <span className="text-title font-semibold text-watch-text">{formatNumber(6432, language)}</span>
              <span className="block text-caption text-watch-muted">{t.watch.steps}</span>
            </ProgressRing>
          </div>
        </div>
      </Section>

      <Section title={d.sections.watchDevice}>
        <SegmentedControl
          label={t.watch.shapeLabel}
          options={watchShapes.map((value) => ({ value, label: t.watch.shapes[value] }))}
          value={shape}
          onChange={setShape}
        />
        <div className="flex justify-center py-6">
          <WatchDevice shape={shape}>
            <div className="grid size-full place-items-center text-center">
              <div>
                <p className="text-watch-time font-semibold tabular-nums">10:09</p>
                <p className="text-watch-date text-watch-muted first-letter:uppercase">{formatWatchDate(new Date(2026, 9, 17), language)}</p>
              </div>
            </div>
          </WatchDevice>
        </div>
      </Section>
    </div>
  )
}
