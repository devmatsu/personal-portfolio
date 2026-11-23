import { useEffect, useState } from 'react';
import type { EquityResult, Scenario } from './engine/equity';
import type { WorkerResponse } from './engine/worker';

export interface EquityState {
  status: 'idle' | 'calculating' | 'done' | 'error';
  /** The latest result for the current scenario (a running partial one while a simulation runs), or null. */
  result: EquityResult | null;
  /** Equity on earlier streets for the current scenario by board size (0 preflop, 3 flop, 4 turn), after `result`. */
  streets: ReadonlyMap<number, EquityResult>;
  error?: string;
}

interface Stored extends EquityState {
  /** The scenario (as its JSON key) that `result` and `streets` were calculated for. */
  key: string | null;
}

/** Waits this long after the last change before calculating, so picking several cards doesn't start several runs. */
const DEBOUNCE_MS = 180;
const NO_STREETS: ReadonlyMap<number, EquityResult> = new Map();

/**
 * Calculates equity for `scenario` in a web worker. A new scenario terminates the previous worker, so outdated work is
 * cancelled immediately; `null` (an incomplete scenario) clears the result. Results are only ever returned for the
 * scenario they were calculated for: right after a change, `result` is null and `streets` empty until the new numbers
 * arrive, so a removed seat or card never shows another scenario's equity.
 */
export function useEquity(scenario: Scenario | null): EquityState {
  const [state, setState] = useState<Stored>({ status: 'idle', result: null, streets: NO_STREETS, key: null });
  const key = scenario ? JSON.stringify(scenario) : null;

  useEffect(() => {
    if (!scenario) {
      setState({ status: 'idle', result: null, streets: NO_STREETS, key: null });
      return;
    }
    setState((previous) => ({ ...previous, status: 'calculating', error: undefined }));
    let worker: Worker | null = null;
    const timer = window.setTimeout(() => {
      worker = new Worker(new URL('./engine/worker.ts', import.meta.url), { type: 'module' });
      worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
        const message = event.data;
        // A new final result replaces any earlier streets from the previous scenario; its own streets follow.
        if (message.type === 'done') setState({ status: 'done', result: message.result, streets: new Map(), key });
        else if (message.type === 'street') {
          setState((previous) => ({ ...previous, streets: new Map(previous.key === key ? previous.streets : []).set(message.boardSize, message.result), key }));
        } else if (message.type === 'error') setState({ status: 'error', result: null, streets: NO_STREETS, key, error: message.message });
        else setState((previous) => ({ ...previous, status: 'calculating', result: message.result, streets: previous.key === key ? previous.streets : NO_STREETS, key }));
      });
      worker.addEventListener('error', () => setState({ status: 'error', result: null, streets: NO_STREETS, key, error: 'The calculation failed.' }));
      worker.postMessage({ scenario });
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      worker?.terminate();
    };
    // The scenario is compared by value (its JSON key), not by object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const current = state.key === key;
  return { status: state.status, result: current ? state.result : null, streets: current ? state.streets : NO_STREETS, error: state.error };
}
