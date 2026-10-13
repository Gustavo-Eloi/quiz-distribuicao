import clsx from 'clsx'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={clsx('rounded-2xl border border-slate-200/80 bg-card shadow-sm', className)}>
      {children}
    </div>
  )
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2.5 text-sm',
        size === 'lg' && 'px-5 py-3 text-base',
        variant === 'primary' && 'bg-bayer-blue text-white hover:bg-bayer-blue-mid',
        variant === 'secondary' && 'border border-slate-200 bg-white text-ink hover:bg-slate-50',
        variant === 'ghost' && 'bg-transparent text-bayer-blue hover:bg-bayer-blue/5',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        variant === 'success' && 'bg-bayer-green text-white hover:bg-bayer-green-dark',
        variant === 'warning' && 'bg-bayer-yellow text-ink hover:brightness-95',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-ink outline-none ring-bayer-cyan/30 placeholder:text-slate-400 focus:ring-2',
        className,
      )}
      {...props}
    />
  )
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-ink outline-none ring-bayer-cyan/30 placeholder:text-slate-400 focus:ring-2',
        className,
      )}
      {...props}
    />
  )
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-ink outline-none ring-bayer-cyan/30 focus:ring-2',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-muted">{children}</label>
}

export function Badge({
  children,
  tone = 'blue',
}: {
  children: ReactNode
  tone?: 'blue' | 'green' | 'yellow' | 'slate' | 'red'
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold',
        tone === 'blue' && 'bg-bayer-blue/10 text-bayer-blue',
        tone === 'green' && 'bg-bayer-green/15 text-bayer-green-dark',
        tone === 'yellow' && 'bg-bayer-yellow/30 text-amber-800',
        tone === 'slate' && 'bg-slate-100 text-slate-600',
        tone === 'red' && 'bg-red-50 text-red-700',
      )}
    >
      {children}
    </span>
  )
}

export function PageShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={clsx('mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6', className)}>
      {children}
    </div>
  )
}

export function BrandHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className={clsx('animate-rise', compact ? 'mb-4' : 'mb-8')}>
      <div className="flex items-center gap-3">
        <img
          src="/bayer_logo.png"
          alt="Bayer"
          className="h-12 w-12 rounded-full object-cover shadow-sm"
        />
        <div>
          <h1
            className={clsx(
              'font-bold tracking-tight text-bayer-blue',
              compact ? 'text-xl' : 'text-2xl sm:text-3xl',
            )}
          >
            Quiz Distribuição
          </h1>
          {!compact && (
            <p className="mt-1 text-sm text-muted sm:text-base">
              IA na prática: decisões mais ágeis, processos mais inteligentes
            </p>
          )}
        </div>
      </div>
    </header>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-bayer-blue border-t-transparent" />
    </div>
  )
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-10 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </div>
  )
}
