const patterns = {
  tap: 8,
  select: 12,
  success: [10, 60, 10],
  error: [30, 50, 30],
} as const

type HapticPattern = keyof typeof patterns

export function haptic(pattern: HapticPattern = 'tap') {
  navigator.vibrate?.(patterns[pattern])
}
