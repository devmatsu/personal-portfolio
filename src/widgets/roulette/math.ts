export function winnerIndexFromRotation(rotation: number, count: number): number {
  if (!Number.isInteger(count) || count < 1) throw new RangeError('count must be a positive integer');
  const normalized = ((rotation % 360) + 360) % 360;
  const pointerAngle = (360 - normalized) % 360;
  return Math.floor(pointerAngle / (360 / count)) % count;
}

export function rotationForWinner(index: number, count: number, turns: number): number {
  if (!Number.isInteger(count) || count < 1 || !Number.isInteger(index) || index < 0 || index >= count) {
    throw new RangeError('winner index must be within a non-empty wheel');
  }
  const center = (index + 0.5) * (360 / count);
  return turns * 360 + ((360 - center) % 360);
}
