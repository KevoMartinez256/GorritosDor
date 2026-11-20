export const SUSPENSE_MS = 6000
export const REVEAL_MS = 8000

export function revealPercentage(elapsed: number, index: number, finalPercent: number) {
  const wave = (time: number) => 12 + 76 * (0.5 + 0.5 * Math.sin(time / 430 + index * 1.9) * Math.cos(time / 710 + index))
  if (elapsed <= 0) return 0
  if (elapsed < SUSPENSE_MS) return wave(elapsed) * Math.min(1, elapsed / 600)
  if (elapsed >= REVEAL_MS) return finalPercent
  const progress = (elapsed - SUSPENSE_MS) / (REVEAL_MS - SUSPENSE_MS)
  const eased = 1 - Math.pow(1 - progress, 3)
  return wave(SUSPENSE_MS) * (1 - eased) + finalPercent * eased
}
