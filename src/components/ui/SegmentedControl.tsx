import { cx } from '../../lib/cx'

type SegmentedControlProps<T extends string> = {
  label: string
  options: ReadonlyArray<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string>({ label, options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex gap-1 self-start rounded-full bg-surface p-1">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cx(
              'min-h-11 rounded-full px-5 text-body-sm font-medium transition duration-200 ease-out-soft',
              'focus-visible:outline-2 focus-visible:outline-primary',
              selected ? 'bg-surface-raised text-text-primary' : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
