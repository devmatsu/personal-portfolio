// The wheel's landing maths, tested directly (no browser): the pointer must stop inside the winning slice for every
// landing spot the widget can pick, away from the dividing lines, and those spots must spread across the slice
// rather than always hitting its middle.
import { expect, test } from '@playwright/test';
import { EDGE_MARGIN, landingOffset, rotationForWinner, winnerIndexFromRotation } from '../src/widgets/wheel/math';

test('every landing spot the widget can pick stops on the chosen winner', () => {
  for (let count = 2; count <= 24; count += 1) {
    for (let index = 0; index < count; index += 1) {
      for (let draw = 0; draw < 10_000; draw += 97) {
        const offset = landingOffset(draw / 10_000);
        for (const turns of [5, 6, 7]) {
          expect(winnerIndexFromRotation(rotationForWinner(index, count, turns, offset), count), `${count} slices, #${index}, offset ${offset}`).toBe(index);
        }
      }
    }
  }
});

test('the landing spot stays clear of the dividing lines but leans toward them', () => {
  const offsets = Array.from({ length: 10_000 }, (_, draw) => landingOffset(draw / 10_000));
  expect(Math.min(...offsets)).toBeGreaterThanOrEqual(EDGE_MARGIN);
  expect(Math.max(...offsets)).toBeLessThanOrEqual(1 - EDGE_MARGIN);
  // Near an edge (outer fifth of the slice on either side) far more often than a uniform spot would be (40%).
  const nearEdge = offsets.filter((offset) => offset < 0.2 || offset > 0.8).length / offsets.length;
  expect(nearEdge).toBeGreaterThan(0.6);
  // Both edges get used: sometimes it barely made it in, sometimes it nearly tipped into the next slice.
  expect(offsets.some((offset) => offset < 0.15)).toBe(true);
  expect(offsets.some((offset) => offset > 0.85)).toBe(true);
});
