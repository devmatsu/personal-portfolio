import { useEffect, useRef, useState, type MouseEvent } from 'react';
import styles from './timer.module.css';
import { average, createScramble, effectiveTime, formatTime, mean, type Solve } from './logic';
import { hasModifier, isShortcutTarget, isTextEntry } from '../shortcuts';

type Settings = { inspection: boolean };
const SOLVES_KEY = 'v3.rubik.solves';
const SETTINGS_KEY = 'v3.rubik.settings';

function loadSolves(): Solve[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SOLVES_KEY) ?? '[]');
    if (Array.isArray(parsed)) return parsed.filter((item): item is Solve => typeof item === 'object' && item !== null && 'id' in item && 'timeMs' in item && 'penalty' in item);
  } catch { /* Start with an empty session when storage is unavailable or invalid. */ }
  return [];
}

function loadSettings(): Settings {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    return { inspection: typeof parsed === 'object' && parsed !== null && 'inspection' in parsed && parsed.inspection === true };
  } catch { return { inspection: false }; }
}

export default function Timer() {
  const [solves, setSolves] = useState<Solve[]>([]);
  const [settings, setSettings] = useState<Settings>({ inspection: false });
  const [hydrated, setHydrated] = useState(false);
  const [scramble, setScramble] = useState(createScramble);
  const [phase, setPhase] = useState<'idle' | 'holding' | 'ready' | 'inspection' | 'running'>('idle');
  const [display, setDisplay] = useState('0:00.00');
  const [inspectionPenalty, setInspectionPenalty] = useState<Solve['penalty']>('none');
  const holdTimer = useRef<number | null>(null);
  const startTime = useRef(0);
  const inspectionStart = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => { setSolves(loadSolves()); setSettings(loadSettings()); setHydrated(true); }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(SOLVES_KEY, JSON.stringify(solves)); }, [solves, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }, [settings, hydrated]);
  useEffect(() => {
    if (phase !== 'running') return;
    const timer = window.setInterval(() => setDisplay(formatTime(Date.now() - startTime.current)), 10);
    return () => window.clearInterval(timer);
  }, [phase]);
  useEffect(() => {
    if (phase !== 'inspection') return;
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - inspectionStart.current;
      setDisplay(formatTime(Math.max(0, 15000 - elapsed)));
      if (elapsed > 17000) setInspectionPenalty('dnf');
      else if (elapsed > 15000) setInspectionPenalty('plus2');
    }, 50);
    return () => window.clearInterval(timer);
  }, [phase]);

  function beginHold() {
    if (phaseRef.current !== 'idle') return;
    setPhase('holding');
    holdTimer.current = window.setTimeout(() => {
      setPhase('ready');
    }, 300);
  }

  function cancelHold() {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    if (phaseRef.current === 'holding') setPhase('idle');
    else if (phaseRef.current === 'ready') {
      if (settings.inspection) {
        inspectionStart.current = Date.now();
        setInspectionPenalty('none');
        setPhase('inspection');
      } else {
        setInspectionPenalty('none');
        startTime.current = Date.now();
        setPhase('running');
      }
    }
  }

  function stopSolve() {
    const timeMs = Date.now() - startTime.current;
    setSolves((current) => [{ id: `${Date.now()}-${Math.random()}`, timeMs, penalty: inspectionPenalty, createdAt: Date.now() }, ...current]);
    setDisplay(formatTime(timeMs + (inspectionPenalty === 'plus2' ? 2000 : 0)));
    setScramble(createScramble());
    setPhase('idle');
  }

  function stopOrStart() {
    if (phaseRef.current === 'running') stopSolve();
    else if (phaseRef.current === 'inspection') {
      const elapsed = Date.now() - inspectionStart.current;
      if (elapsed > 17000) setInspectionPenalty('dnf');
      else if (elapsed > 15000) setInspectionPenalty('plus2');
      startTime.current = Date.now();
      setPhase('running');
    }
  }

  useEffect(() => {
    function keyDown(event: KeyboardEvent) {
      const phase = phaseRef.current;
      // While inspection or a solve runs, any key advances it (cubing convention), except typing and browser shortcuts.
      if (phase === 'running' || phase === 'inspection') {
        if (event.repeat || hasModifier(event) || isTextEntry(event.target)) return;
        event.preventDefault();
        stopOrStart();
      } else if (phase === 'idle' && event.code === 'Space' && !event.repeat && isShortcutTarget(event)) {
        event.preventDefault();
        beginHold();
      }
    }
    function keyUp(event: KeyboardEvent) {
      // Only finish a hold this widget started, so Space on a focused control still activates it on keyup.
      if (event.code !== 'Space' || (phaseRef.current !== 'holding' && phaseRef.current !== 'ready')) return;
      event.preventDefault();
      cancelHold();
    }
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    return () => { window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp); };
  });

  // A pointer click leaves focus on the penalty button, so holding Space for the next solve would
  // toggle it on keyup instead of starting the timer. Drop that focus; keyboard activation (detail 0)
  // keeps it so Tab + Space/Enter still toggles deliberately.
  function markSolve(event: MouseEvent<HTMLButtonElement>, id: string, penalty: Solve['penalty']) {
    if (event.detail > 0) event.currentTarget.blur();
    setSolves((current) => current.map((solve) => solve.id === id ? { ...solve, penalty } : solve));
  }

  const currentTime = (solve: Solve): string => formatTime(effectiveTime(solve));
  const best = solves.length ? Math.min(...solves.map(effectiveTime)) : null;
  const shown = phase === 'running' ? display : phase === 'inspection' ? display : solves.length ? currentTime(solves[0]!) : display;
  const areaStart = () => { if (phaseRef.current === 'idle') beginHold(); };
  const areaEnd = () => { if (phaseRef.current === 'holding' || phaseRef.current === 'ready') cancelHold(); else stopOrStart(); };

  return <section className={styles.timer} aria-label="Rubik's cube timer">
    <div className={styles.scramble} aria-label="Scramble">{scramble}</div>
    <button className={`${styles.clock} ${phase === 'ready' ? styles.ready : ''}`} data-shortcut-surface onPointerDown={(event) => { event.preventDefault(); areaStart(); }} onPointerUp={areaEnd} onPointerCancel={cancelHold} onContextMenu={(event) => event.preventDefault()} aria-label="Timer: hold to ready, release to start; tap to stop">
      <span>{phase === 'holding' ? 'HOLD' : phase === 'ready' ? 'READY' : shown}</span>
    </button>
    <div className={styles.toolbar}>
      <label><input type="checkbox" checked={settings.inspection} onChange={(event) => setSettings({ inspection: event.target.checked })} /> 15 s inspection</label>
      <span>{phase === 'inspection' ? `Inspection · ${inspectionPenalty === 'dnf' ? 'DNF' : inspectionPenalty === 'plus2' ? '+2' : 'ready'}` : phase === 'running' ? 'Tap or press any key to stop' : 'Hold Space or tap to start'}</span>
    </div>
    <div className={styles.stats} aria-label="Session statistics">
      <Stat label="Best" value={best === null ? '—' : formatTime(best)} />
      <Stat label="ao5" value={average(solves, 5) === null ? '—' : formatTime(average(solves, 5)!)} />
      <Stat label="ao12" value={average(solves, 12) === null ? '—' : formatTime(average(solves, 12)!)} />
      <Stat label="Mean" value={mean(solves) === null ? '—' : formatTime(mean(solves)!)} />
    </div>
    <div className={styles.solveHeader}><h2>Session</h2><span>{solves.length} solves</span></div>
    <ol className={styles.solves}>{solves.map((solve, index) => <li key={solve.id}>
      <span className={styles.index}>{solves.length - index}</span><strong>{currentTime(solve)}</strong>
      <button onClick={(event) => markSolve(event, solve.id, solve.penalty === 'plus2' ? 'none' : 'plus2')} aria-label={`Toggle +2 for solve ${solves.length - index}`}>+2</button>
      <button onClick={(event) => markSolve(event, solve.id, solve.penalty === 'dnf' ? 'none' : 'dnf')} aria-label={`Toggle DNF for solve ${solves.length - index}`}>DNF</button>
      <button onClick={() => setSolves((current) => current.filter((item) => item.id !== solve.id))} aria-label={`Delete solve ${solves.length - index}`}>×</button>
    </li>)}</ol>
  </section>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className={styles.stat}><span>{label}</span><strong>{value}</strong></div>;
}
