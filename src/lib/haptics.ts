const patterns: Record<string, VibratePattern> = {
  tap: 8,
  select: 12,
  success: [10, 60, 10],
  error: [30, 50, 30],
}

export type HapticPattern = 'tap' | 'select' | 'success' | 'error'

export function haptic(pattern: HapticPattern = 'tap') {
  navigator.vibrate?.(patterns[pattern])
}
