import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-gradient text-text-primary shadow-glow',
  secondary: 'bg-surface-raised text-text-primary',
  danger: 'bg-danger text-text-primary',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary',
}

// Both sizes keep at least a 48px touch target.
const sizeClasses: Record<ButtonSize, string> = {
  md: 'min-h-touch px-6 text-body-sm',
  lg: 'min-h-14 px-8 text-body',
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold',
        'transition duration-150 ease-out-soft active:scale-97',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'disabled:pointer-events-none disabled:opacity-40',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
