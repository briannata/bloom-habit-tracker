export function todayInTz(timezone: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return fmt.format(new Date())
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

export function calcStreak(
  completedDates: Set<string>,
  today: string,
): number {
  let streak = 0
  let cursor = today
  if (!completedDates.has(cursor)) {
    cursor = addDays(cursor, -1)
  }
  while (completedDates.has(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}
