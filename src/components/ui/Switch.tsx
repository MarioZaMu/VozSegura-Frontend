import { useId } from 'react'
import { cx } from '../../lib/cx'

type SwitchProps = {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Switch({ label, description, checked, onChange }: SwitchProps) {
  const id = useId()

  return (
    <div className="flex min-h-touch items-center justify-between gap-4">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-body-sm font-medium">{label}</span>
        {description && <span className="block text-caption text-text-secondary">{description}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200 ease-out-soft',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          checked ? 'bg-brand-gradient' : 'bg-surface-raised',
        )}
      >
        <span
          className={cx(
            'absolute top-1 left-1 size-6 rounded-full bg-white shadow-card transition-transform duration-200 ease-out-soft',
            checked && 'translate-x-6',
          )}
        />
      </button>
    </div>
  )
}
