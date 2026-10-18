import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'

type CardProps = HTMLAttributes<HTMLElement> & {
  title?: string
  icon?: ReactNode
  raised?: boolean
}

export function Card({ title, icon, raised = false, className, children, ...props }: CardProps) {
  return (
    <section
      className={cx(
        'rounded-card p-5 shadow-card',
        raised ? 'bg-surface-raised' : 'bg-surface',
        className,
      )}
      {...props}
    >
      {title && (
        <header className="mb-4 flex items-center gap-3">
          {icon && (
            <span
              className={cx(
                'grid size-10 place-items-center rounded-full text-primary',
                raised ? 'bg-surface' : 'bg-surface-raised',
              )}
            >
              {icon}
            </span>
          )}
          <h2 className="text-title font-semibold">{title}</h2>
        </header>
      )}
      {children}
    </section>
  )
}
