// Native date utilities — no date libraries

export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday start
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

export function toIso8601(date: Date): string {
  return date.toISOString()
}

export function parseHHMM(time: string, baseDate: Date): Date {
  const [hours, minutes] = time.split(':').map(Number)
  const d = new Date(baseDate)
  d.setHours(hours, minutes, 0, 0)
  return d
}
