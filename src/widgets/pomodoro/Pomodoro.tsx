import { useEffect, useRef, useState } from 'react';
import styles from './pomodoro.module.css';
import { advance, DEFAULT_SETTINGS, durationMs, reconcile, type Mode, type Settings, type TimerState } from './timer';
import { isShortcutTarget } from '../shortcuts';

const KEY = 'v3.pomodoro.state';
// The live timer is stored separately so a running session survives a reload or leaving the page:
// endAt is an absolute timestamp, so the remaining time is recomputed on return.
const TIMER_KEY = 'v3.pomodoro.timer';
const MODES: readonly Mode[] = ['focus', 'short', 'long'];
interface Stored { settings: Settings; today: string; count: number }
const todayKey = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };

function loadStored(): Stored {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (value && typeof value === 'object') {
      const stored = value as Partial<Stored>;
      if (stored.settings && stored.today === todayKey() && typeof stored.count === 'number') {
        return { settings: stored.settings, today: stored.today, count: stored.count };
      }
      if (stored.settings) return { settings: stored.settings, today: todayKey(), count: 0 };
    }
  } catch { /* Ignore malformed local storage. */ }
  return { settings: DEFAULT_SETTINGS, today: todayKey(), count: 0 };
}

function loadTimer(settings: Settings): TimerState {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(TIMER_KEY) ?? 'null');
    if (value && typeof value === 'object') {
      const saved = value as Partial<TimerState>;
      if (MODES.includes(saved.mode as Mode) && Number.isFinite(saved.remainingMs) && Number.isFinite(saved.completedFocus)
        && (saved.endAt === null || Number.isFinite(saved.endAt))) {
        return { mode: saved.mode as Mode, remainingMs: saved.remainingMs!, endAt: saved.endAt ?? null, completedFocus: saved.completedFocus! };
      }
    }
  } catch { /* Ignore malformed local storage. */ }
  return { mode: 'focus', remainingMs: durationMs('focus', settings), endAt: null, completedFocus: 0 };
}

export default function Pomodoro() {
  const [stored, setStored] = useState<Stored>(() => loadStored());
  const [timer, setTimer] = useState<TimerState>(() => loadTimer(loadStored().settings));
  const [now, setNow] = useState(Date.now());
  const [notification, setNotification] = useState(false);
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') setNotification(true);
  }, []);
  const previousTitle = useRef('');
  const timerRef = useRef(timer);
  timerRef.current = timer;
  const settings = stored.settings;
  const current = timer.endAt === null ? timer : { ...timer, remainingMs: Math.max(0, timer.endAt - now) };
  const seconds = Math.ceil(current.remainingMs / 1000);
  const label = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(stored)); } catch { /* Storage is optional. */ }
  }, [stored]);

  useEffect(() => {
    try { localStorage.setItem(TIMER_KEY, JSON.stringify(timer)); } catch { /* Storage is optional. */ }
  }, [timer]);

  useEffect(() => {
    if (timer.endAt === null) return;
    const tick = () => {
      const at = Date.now();
      setNow(at);
      const value = timerRef.current;
      if (value.endAt === null || at < value.endAt) return;
      const result = reconcile(value, settings, at);
      timerRef.current = result.state;
      setTimer(result.state);
      if (result.completed > 0) {
        if (value.mode === 'focus') setStored((old) => ({ ...old, today: todayKey(), count: old.today === todayKey() ? old.count + 1 : 1 }));
        new Audio('/sounds/notification.mp3').play().catch(() => undefined);
        if ('Notification' in window && Notification.permission === 'granted') new Notification('Pomodoro complete', { body: 'Time for your next session.' });
      }
    };
    const interval = window.setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', tick); };
  }, [timer.endAt, settings]);

  useEffect(() => {
    if (!previousTitle.current) previousTitle.current = document.title;
    document.title = timer.endAt === null ? previousTitle.current : `${label} · ${timer.mode} · Matsu`;
    return () => { document.title = previousTitle.current; };
  }, [timer.endAt, timer.mode, label]);

  const start = () => { const at = Date.now(); setNow(at); setTimer((value) => ({ ...value, endAt: at + value.remainingMs })); };
  const pause = () => setTimer((value) => value.endAt === null ? value : ({ ...value, remainingMs: Math.max(0, value.endAt - Date.now()), endAt: null }));
  const reset = () => setTimer((value) => ({ ...value, remainingMs: durationMs(value.mode, settings), endAt: null }));
  const skip = () => setTimer((value) => advance(value, settings));
  const changeMode = (mode: Mode) => setTimer({ mode, remainingMs: durationMs(mode, settings), endAt: null, completedFocus: timer.completedFocus });

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (!isShortcutTarget(event)) return;
      if (event.code === 'Space') { event.preventDefault(); timer.endAt === null ? start() : pause(); }
      else if (event.key.toLowerCase() === 'r') reset();
      else if (event.key.toLowerCase() === 's') skip();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  });

  const updateSetting = (key: keyof Settings, raw: string) => {
    const value = Math.max(1, Math.min(key === 'longEvery' ? 12 : 90, Number(raw) || 1));
    const next = { ...settings, [key]: value };
    setStored((old) => ({ ...old, settings: next }));
    if (timer.endAt === null) setTimer((old) => ({ ...old, remainingMs: durationMs(old.mode, next) }));
  };
  const requestNotification = async () => {
    if (!('Notification' in window)) return;
    const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    setNotification(permission === 'granted');
  };
  const progress = Math.max(0, current.remainingMs / durationMs(timer.mode, settings));
  const radius = 96;
  const circumference = 2 * Math.PI * radius;

  return <section className={styles.widget} aria-label="Pomodoro timer">
    <div className={styles.timer}>
      <svg className={styles.ring} viewBox="0 0 220 220" aria-hidden="true">
        <circle className={styles.track} cx="110" cy="110" r={radius} />
        <circle className={styles.progress} cx="110" cy="110" r={radius} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} />
      </svg>
      <div className={styles.readout}><span className={styles.mode}>{timer.mode === 'focus' ? 'FOCUS' : timer.mode === 'short' ? 'SHORT BREAK' : 'LONG BREAK'}</span><span className={styles.time} aria-live="off">{label}</span></div>
    </div>
    <div className={styles.dots} aria-label={`${timer.completedFocus % settings.longEvery} of ${settings.longEvery} focus sessions`}>
      {Array.from({ length: settings.longEvery }, (_, index) => <span key={index} className={index < timer.completedFocus % settings.longEvery ? styles.dotDone : styles.dot} />)}
    </div>
    <div className={styles.controls}>
      <button className={styles.primary} onClick={timer.endAt === null ? start : pause}>{timer.endAt === null ? 'Start' : 'Pause'}</button>
      <button onClick={reset}>Reset</button><button onClick={skip}>Skip</button>
    </div>
    <div className={styles.modes}>
      {(['focus', 'short', 'long'] as const).map((mode) => <button key={mode} aria-pressed={timer.mode === mode} onClick={() => changeMode(mode)}>{mode === 'focus' ? 'Focus' : mode === 'short' ? 'Short break' : 'Long break'}</button>)}
    </div>
    <p className={styles.count}>Today: <strong>{stored.count}</strong> focus sessions completed</p>
    <div className={styles.settings}>
      {(['focus', 'short', 'long'] as const).map((mode) => <label key={mode}>{mode === 'focus' ? 'Focus' : mode === 'short' ? 'Short break' : 'Long break'} (min)<input type="number" min="1" max="90" value={settings[mode]} onChange={(event) => updateSetting(mode, event.target.value)} /></label>)}
      <label>Long break every<input type="number" min="1" max="12" value={settings.longEvery} onChange={(event) => updateSetting('longEvery', event.target.value)} /></label>
    </div>
    <button className={styles.notify} onClick={requestNotification}>{notification ? 'Notifications enabled' : 'Enable notifications'}</button>
    <p className={styles.hint}>Space start/pause · R reset · S skip</p>
  </section>;
}
