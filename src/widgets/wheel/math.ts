/**
 * Where the pointer sits, in degrees clockwise from 12 o'clock. At 3 o'clock, with labels running along the radius,
 * the winning slice's label always ends up reading left to right.
 */
export const POINTER_ANGLE = 90;

export function winnerIndexFromRotation(rotation: number, count: number): number {
  if (!Number.isInteger(count) || count < 1) throw new RangeError('count must be a positive integer');
  const normalized = ((rotation % 360) + 360) % 360;
  const pointerAngle = (POINTER_ANGLE - normalized + 360) % 360;
  return Math.floor(pointerAngle / (360 / count)) % count;
}

/**
 * Rotation that brings the pointer to `offset` across the winning slice (0 = its leading edge, 1 = its trailing
 * edge) after `turns` full turns.
 */
export function rotationForWinner(index: number, count: number, turns: number, offset = 0.5): number {
  if (!Number.isInteger(count) || count < 1 || !Number.isInteger(index) || index < 0 || index >= count) {
    throw new RangeError('winner index must be within a non-empty wheel');
  }
  if (!(offset > 0 && offset < 1)) throw new RangeError('offset must be inside the slice');
  const angle = (index + offset) * (360 / count);
  return turns * 360 + (((POINTER_ANGLE - angle) % 360) + 360) % 360;
}

/** Never stop closer to a dividing line than this share of a slice, so the winner is never ambiguous. */
export const EDGE_MARGIN = 0.06;

/**
 * Where in the winning slice to stop, from a uniform `u` in [0, 1). Leans strongly toward the edges (where the wheel
 * looks like it might tip into the next slice) while never touching them. The winner itself is picked separately and
 * uniformly, so this only changes how the landing looks, not who wins.
 */
export function landingOffset(u: number): number {
  const fromCentre = Math.cbrt(Math.abs(2 * u - 1)) * (0.5 - EDGE_MARGIN);
  return u < 0.5 ? 0.5 - fromCentre : 0.5 + fromCentre;
}
