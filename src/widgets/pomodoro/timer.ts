export type Mode = 'focus' | 'short' | 'long';

export interface Settings {
  focus: number;
  short: number;
  long: number;
  longEvery: number;
}

export interface TimerState {
  mode: Mode;
  remainingMs: number;
  endAt: number | null;
  completedFocus: number;
}

export const DEFAULT_SETTINGS: Settings = { focus: 25, short: 5, long: 15, longEvery: 4 };

export function durationMs(mode: Mode, settings: Settings): number {
  return settings[mode] * 60_000;
}

export function advance(state: TimerState, settings: Settings): TimerState {
  if (state.mode !== 'focus') {
    return { ...state, mode: 'focus', remainingMs: durationMs('focus', settings), endAt: null };
  }
  const completedFocus = state.completedFocus + 1;
  const mode: Mode = completedFocus % settings.longEvery === 0 ? 'long' : 'short';
  return { ...state, mode, completedFocus, remainingMs: durationMs(mode, settings), endAt: null };
}

export function reconcile(state: TimerState, settings: Settings, now: number): { state: TimerState; completed: number } {
  if (state.endAt === null || now < state.endAt) return { state, completed: 0 };
  const next = advance({ ...state, remainingMs: 0, endAt: null }, settings);
  return { state: next, completed: 1 };
}
