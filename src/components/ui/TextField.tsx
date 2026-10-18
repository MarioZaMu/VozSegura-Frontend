import { useId } from 'react'
import { cx } from '../../lib/cx'

type TextFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  maxLength?: number
  multiline?: boolean
  disabled?: boolean
  onEnter?: () => void
}

const fieldClasses = cx(
  'w-full rounded-md bg-surface-raised px-4 text-body-sm text-text-primary placeholder:text-text-secondary',
  'focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40',
)

export function TextField({ label, value, onChange, placeholder, hint, maxLength, multiline = false, disabled, onEnter }: TextFieldProps) {
  const id = useId()
  const common = { id, value, placeholder, maxLength, disabled, 'aria-describedby': hint ? `${id}-hint` : undefined }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-body-sm font-medium">
        {label}
      </label>
      {multiline ? (
        <textarea {...common} rows={3} onChange={(event) => onChange(event.target.value)} className={cx(fieldClasses, 'resize-none py-3')} />
      ) : (
        <input
          {...common}
          type="text"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && onEnter?.()}
          className={cx(fieldClasses, 'min-h-touch')}
        />
      )}
      {(hint || maxLength) && (
        <p id={`${id}-hint`} className="flex justify-between gap-4 text-caption text-text-secondary">
          <span>{hint}</span>
          {maxLength && (
            <span>
              {value.length}/{maxLength}
            </span>
          )}
        </p>
      )}
    </div>
  )
}
