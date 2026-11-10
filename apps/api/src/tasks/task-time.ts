export function durationMinutes(takenAt: Date | null, completedAt: Date | null): number | null {
  if (!takenAt || !completedAt) return null
  const ms = completedAt.getTime() - takenAt.getTime()
  if (ms < 0) return null
  return Math.floor(ms / 60_000)
}

export function isOverdue(deadline: Date, status: string, now: Date): boolean {
  return status !== 'DONE' && deadline.getTime() < now.getTime()
}
