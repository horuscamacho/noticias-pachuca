/**
 * CurrentDate Component
 *
 * Renders the current date with suppressHydrationWarning to prevent
 * React hydration errors caused by server/client timestamp differences.
 */

interface CurrentDateProps {
  className?: string
}

export function CurrentDate({ className }: CurrentDateProps) {
  const formatHeaderDate = () => {
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date()).toUpperCase()
  }

  return (
    <span suppressHydrationWarning className={className}>
      {formatHeaderDate()}
    </span>
  )
}
