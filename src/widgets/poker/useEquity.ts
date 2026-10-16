import { useEffect, useState } from 'react';
import type { EquityResult, Scenario } from './engine/equity';
import type { WorkerResponse } from './engine/worker';

export interface EquityState {
  status: 'idle' | 'calculating' | 'done' | 'error';
  /** The latest result. While recalculating it is the previous (or a running partial) result. */
  result: EquityResult | null;
  /** Equity on earlier streets by board size (0 preflop, 3 flop, 4 turn), arriving after `result` is done. */
  streets: Map<number, EquityResult>;
  error?: string;
}

/** Waits this long after the last change before calculating, so picking several cards doesn't start several runs. */
const DEBOUNCE_MS = 180;

/**
 * Calculates equity for `scenario` in a web worker. A new scenario terminates the previous worker, so outdated work is
 * cancelled immediately; `null` (an incomplete scenario) clears the result.
 */
export function useEquity(scenario: Scenario | null): EquityState {
  const [state, setState] = useState<EquityState>({ status: 'idle', result: null, streets: new Map() });
  const key = scenario ? JSON.stringify(scenario) : null;

  useEffect(() => {
    if (!scenario) {
      setState({ status: 'idle', result: null, streets: new Map() });
      return;
    }
    setState((previous) => ({ ...previous, status: 'calculating', error: undefined }));
    let worker: Worker | null = null;
    const timer = window.setTimeout(() => {
      worker = new Worker(new URL('./engine/worker.ts', import.meta.url), { type: 'module' });
      worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
        const message = event.data;
        // A new final result replaces any timeline from the previous scenario; its own streets follow.
        if (message.type === 'done') setState({ status: 'done', result: message.result, streets: new Map() });
        else if (message.type === 'street') setState((previous) => ({ ...previous, streets: new Map(previous.streets).set(message.boardSize, message.result) }));
        else if (message.type === 'error') setState({ status: 'error', result: null, streets: new Map(), error: message.message });
        else setState((previous) => ({ ...previous, status: 'calculating', result: message.result }));
      });
      worker.addEventListener('error', () => setState({ status: 'error', result: null, streets: new Map(), error: 'The calculation failed.' }));
      worker.postMessage({ scenario });
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      worker?.terminate();
    };
    // The scenario is compared by value (its JSON key), not by object identity.
  }, [key]);

  return state;
}
