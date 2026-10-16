/// <reference lib="webworker" />
// Runs one equity calculation off the main thread. The page starts a fresh worker per calculation and terminates it
// when the scenario changes, which cancels outdated work instantly (a busy loop can't otherwise be interrupted).
import { countDeals, EXACT_DEAL_LIMIT, exactEquity, marginOfError, simulateEquity, type EquityResult, type Scenario } from './equity';
import { seededRandom } from './random';

export type WorkerRequest = { scenario: Scenario };
export type WorkerResponse =
  | { type: 'progress'; result: EquityResult }
  | { type: 'done'; result: EquityResult }
  /** After `done`: equity on an earlier street (the board cut to `boardSize` cards), for the street-by-street timeline. */
  | { type: 'street'; boardSize: number; result: EquityResult }
  | { type: 'error'; message: string };

/** A simulation stops once hero's 95% margin of error is within ±0.1 percentage points… */
const TARGET_MARGIN = 0.001;
/** …but always runs at least this many trials, and never more than the maximum. */
const MIN_TRIALS = 50_000;
const MAX_TRIALS = 1_000_000;
const BATCH = 25_000;

const post = (message: WorkerResponse) => postMessage(message);

/** Exact when every deal can be counted quickly, otherwise simulated until the margin target is met. */
function calculate(scenario: Scenario, onProgress?: (partial: EquityResult) => void): EquityResult {
  if (countDeals(scenario) <= EXACT_DEAL_LIMIT) return exactEquity(scenario);
  const random = seededRandom((Math.random() * 2 ** 32) >>> 0);
  return simulateEquity(scenario, MAX_TRIALS, random, (partial) => {
    const settled = partial.samples >= MIN_TRIALS && marginOfError(partial) <= TARGET_MARGIN;
    if (!settled) onProgress?.(partial);
    return !settled;
  }, BATCH);
}

addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  try {
    const { scenario } = event.data;
    post({ type: 'done', result: calculate(scenario, (partial) => post({ type: 'progress', result: partial })) });
    // Earlier streets with the same hands, nearest first: the turn and flop are quick exact counts, preflop is often a
    // simulation, so the timeline fills in from the right.
    for (const boardSize of [4, 3, 0]) {
      if (boardSize >= scenario.board.length) continue;
      post({ type: 'street', boardSize, result: calculate({ ...scenario, board: scenario.board.slice(0, boardSize) }) });
    }
  } catch (error) {
    post({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
});
