export type Solve = { id: string; timeMs: number; penalty: 'none' | 'plus2' | 'dnf'; createdAt: number };

const FACES = ['U', 'R', 'F', 'D', 'L', 'B'] as const;
const AXIS: Record<(typeof FACES)[number], number> = { U: 0, D: 0, R: 1, L: 1, F: 2, B: 2 };

export function createScramble(random: () => number = Math.random): string {
  const moves: string[] = [];
  let previousFace = '';
  let previousAxis = -1;
  let run = 0;
  while (moves.length < 20) {
    const face = FACES[Math.floor(random() * FACES.length)]!;
    const axis = AXIS[face];
    if (face === previousFace || (axis === previousAxis && run >= 2)) continue;
    run = axis === previousAxis ? run + 1 : 1;
    previousAxis = axis;
    previousFace = face;
    const suffix = ['', "'", '2'][Math.floor(random() * 3)]!;
    moves.push(face + suffix);
  }
  return moves.join(' ');
}

export function effectiveTime(solve: Solve): number {
  return solve.penalty === 'dnf' ? Number.POSITIVE_INFINITY : solve.timeMs + (solve.penalty === 'plus2' ? 2000 : 0);
}

export function formatTime(ms: number): string {
  if (!Number.isFinite(ms)) return 'DNF';
  const centiseconds = Math.floor(ms / 10);
  const cs = centiseconds % 100;
  const seconds = Math.floor(centiseconds / 100) % 60;
  const minutes = Math.floor(centiseconds / 6000);
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

export function average(solves: Solve[], count: 5 | 12): number | null {
  if (solves.length < count) return null;
  const values = solves.slice(0, count).map(effectiveTime).sort((a, b) => a - b);
  const trimmed = values.slice(1, -1);
  if (trimmed.some((time) => !Number.isFinite(time))) return Number.POSITIVE_INFINITY;
  return trimmed.reduce((sum, time) => sum + time, 0) / trimmed.length;
}

export function mean(solves: Solve[]): number | null {
  if (!solves.length) return null;
  if (solves.some((solve) => solve.penalty === 'dnf')) return Number.POSITIVE_INFINITY;
  return solves.reduce((sum, solve) => sum + effectiveTime(solve), 0) / solves.length;
}
