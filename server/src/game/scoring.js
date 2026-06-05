// partialRatio: 0 = no credit, 0..1 = partial, 1 = full
export function score({ baseScore, timeLimitMs, elapsedMs, correct, partialRatio = 1 }) {
  const ratio = correct ? partialRatio : 0;
  if (ratio <= 0) return 0;
  const timeRatio = Math.max(0.2, 1 - elapsedMs / timeLimitMs);
  return Math.round(baseScore * timeRatio * ratio);
}
