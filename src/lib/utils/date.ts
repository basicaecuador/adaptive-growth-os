export function formatDate(date: Date | string, locale = 'es-ES'): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatMonth(month: number, year: number, locale = 'es-ES'): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1))
}

export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

export function isCurrentMonth(month: number, year: number): boolean {
  const now = new Date()
  return now.getMonth() + 1 === month && now.getFullYear() === year
}
