import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './roulette.module.css';
import { rotationForWinner, winnerIndexFromRotation } from './math';
import { randomIndex } from '../random';

const STORAGE_KEY = 'v3.roulette.options';
const DEFAULT_OPTIONS = ['Pizza', 'Sushi', 'Tacos', 'Pasta'];

function readOptions(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (Array.isArray(saved)) return saved.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  } catch { /* Start with defaults when storage is unavailable or malformed. */ }
  return DEFAULT_OPTIONS;
}

function pointOnWheel(cx: number, cy: number, radius: number, angle: number): [number, number] {
  const radians = ((angle - 90) * Math.PI) / 180;
  return [cx + radius * Math.cos(radians), cy + radius * Math.sin(radians)];
}

export default function Roulette() {
  const [options, setOptions] = useState<string[]>(DEFAULT_OPTIONS);
  const [draft, setDraft] = useState('');
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [removeWinner, setRemoveWinner] = useState(false);
  // The spin settles in a timeout, so it reads the toggle through a ref to honour a change made mid-spin.
  const removeWinnerRef = useRef(removeWinner);
  removeWinnerRef.current = removeWinner;
  const [result, setResult] = useState('');
  const [highlight, setHighlight] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setOptions(readOptions());
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(options)); } catch { /* Storage is optional. */ }
  }, [options]);

  const slices = useMemo(() => options.map((label, index) => {
    const count = options.length;
    const start = (index * 360) / count;
    const end = ((index + 1) * 360) / count;
    const [x1, y1] = pointOnWheel(150, 150, 140, start);
    const [x2, y2] = pointOnWheel(150, 150, 140, end);
    const path = count === 1 ? 'M150 150 L150 10 A140 140 0 1 1 149.99 10 Z' : `M150 150 L${x1} ${y1} A140 140 0 ${end - start > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;
    const middle = start + (end - start) / 2;
    const [tx, ty] = pointOnWheel(150, 150, 88, middle);
    return { label, path, tx, ty, middle, index };
  }), [options]);

  function addOptions(raw: string) {
    const added = raw.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    if (added.length) setOptions((current) => [...current, ...added]);
    setDraft('');
  }

  function spin() {
    if (spinning || options.length < 2) return;
    const index = randomIndex(options.length);
    const turns = 5 + randomIndex(3);
    const target = rotationForWinner(index, options.length, turns);
    const duration = reducedMotion ? 180 : 4800;
    setHighlight(null);
    setResult('');
    setSpinning(true);
    setRotation((current) => current + (target - (current % 360) + 360) % 360 + turns * 360);
    window.setTimeout(() => {
      const finalRotation = rotation + (target - (rotation % 360) + 360) % 360 + turns * 360;
      const winner = winnerIndexFromRotation(finalRotation, options.length);
      const label = options[winner]!;
      setResult(`The wheel landed on ${label}.`);
      setSpinning(false);
      // The highlight was cleared when the spin began. A removed winner has nothing left to mark:
      // keeping its index would highlight the option that moved into its place.
      if (removeWinnerRef.current) setOptions((current) => current.filter((_, optionIndex) => optionIndex !== winner));
      else setHighlight(winner);
    }, duration);
  }

  return <section className={styles.widget} aria-label="Roulette picker">
    <div className={styles.wheelWrap}>
      <span className={styles.pointer} aria-hidden="true" />
      <svg className={styles.wheel} style={{ transform: `rotate(${rotation}deg)`, opacity: spinning && reducedMotion ? 0.55 : 1, transition: reducedMotion ? 'opacity 180ms ease-out' : spinning ? 'transform 4800ms cubic-bezier(.12,.72,.12,1)' : 'none' }} viewBox="0 0 300 300" role="img" aria-label={`Wheel with ${options.length} options`}>
        {slices.map((slice) => <g key={`${slice.index}-${slice.label}`}>
          <path d={slice.path} fill={slice.index % 2 === 0 ? 'rgba(var(--accent-rgb),0.72)' : 'rgba(var(--text-rgb),0.12)'} stroke="rgba(var(--text-rgb),0.18)" strokeWidth="1" />
          <text x={slice.tx} y={slice.ty} transform={`rotate(${slice.middle > 90 && slice.middle < 270 ? slice.middle + 180 : slice.middle} ${slice.tx} ${slice.ty})`} textAnchor="middle" dominantBaseline="middle" className={`${styles.label} ${highlight === slice.index ? styles.winner : ''}`}>{slice.label.length > 18 ? `${slice.label.slice(0, 17)}…` : slice.label}</text>
        </g>)}
        <circle cx="150" cy="150" r="13" fill="var(--surface)" stroke="rgba(var(--text-rgb),0.2)" />
      </svg>
    </div>
    <div className={styles.controls}>
      <button className="btn btn-primary" type="button" onClick={spin} disabled={spinning || options.length < 2}>Spin</button>
      <label className={styles.removeToggle}><input type="checkbox" checked={removeWinner} onChange={(event) => setRemoveWinner(event.currentTarget.checked)} /> Remove winner after spin</label>
      <form className={styles.addForm} onSubmit={(event) => { event.preventDefault(); if (!spinning) addOptions(draft); }}>
        <label htmlFor="roulette-option" className={styles.inputLabel}>Add an option (paste multiple lines to add several)</label>
        <div className={styles.inputRow}><textarea id="roulette-option" value={draft} onChange={(event) => setDraft(event.currentTarget.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); if (!spinning) addOptions(draft); } }} rows={2} placeholder="Type or paste options" disabled={spinning} /><button className="btn btn-ghost" type="submit" disabled={spinning || !draft.trim()}>Add</button></div>
      </form>
      <ul className={styles.options} aria-label="Wheel options">{options.map((option, index) => <li key={`${index}-${option}`} className={highlight === index ? styles.winner : ''}><span>{option}</span><button type="button" aria-label={`Remove ${option}`} disabled={spinning} onClick={() => { setOptions((current) => current.filter((_, itemIndex) => itemIndex !== index)); setHighlight(null); }}>×</button></li>)}</ul>
      <button className={styles.clear} type="button" onClick={() => { setOptions([]); setHighlight(null); setResult(''); }} disabled={spinning || options.length === 0}>Clear all options</button>
      <p className={styles.result} aria-live="polite" aria-atomic="true">{result}</p>
    </div>
  </section>;
}
