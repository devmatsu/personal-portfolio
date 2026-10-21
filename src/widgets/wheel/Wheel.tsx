import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './wheel.module.css';
import { landingOffset, rotationForWinner } from './math';
import { randomIndex } from '../random';

const STORAGE_KEY = 'v3.wheel.options';
// The widget was called Roulette; options saved under its key carry over on the first visit after the rename.
const LEGACY_KEY = 'v3.roulette.options';
const DEFAULT_OPTIONS = ['Pizza', 'Sushi', 'Tacos', 'Pasta'];

// Okabe-Ito (Color Universal Design), the standard colourblind-safe categorical palette, ordered so warm and cool
// alternate around the wheel. Blue and vermillion are lightened a touch so the dark slice text stays at 5:1 or more.
const PALETTE = ['#E69F00', '#56B4E9', '#DA6000', '#009E73', '#F0E442', '#008CDB', '#CC79A7'];
const SPIN_MS = 6000;
const REDUCED_MS = 180;
// Ease-out cubic: fast at first, then a long, visible crawl, so the last slices pass slowly under the pointer.
const easeOut = (t: number) => 1 - (1 - t) ** 3;

function readOptions(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY) ?? 'null');
    localStorage.removeItem(LEGACY_KEY);
    if (Array.isArray(saved)) return saved.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  } catch { /* Start with defaults when storage is unavailable or malformed. */ }
  return DEFAULT_OPTIONS;
}

function pointOnWheel(cx: number, cy: number, radius: number, angle: number): [number, number] {
  const radians = ((angle - 90) * Math.PI) / 180;
  return [cx + radius * Math.cos(radians), cy + radius * Math.sin(radians)];
}

/** Palette colour for a slice; the last slice never repeats the colour of the first one next to it. */
function sliceColor(index: number, count: number): string {
  if (count > 1 && index === count - 1 && index % PALETTE.length === 0) return PALETTE[3]!;
  return PALETTE[index % PALETTE.length]!;
}

export default function Wheel() {
  const [options, setOptions] = useState<string[]>(DEFAULT_OPTIONS);
  const [draft, setDraft] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [removeWinner, setRemoveWinner] = useState(false);
  // The spin settles asynchronously, so it reads the toggle through a ref to honour a change made mid-spin.
  const removeWinnerRef = useRef(removeWinner);
  removeWinnerRef.current = removeWinner;
  const [winner, setWinner] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  // The wheel turns outside React (one style write per frame); the rotation lives in a ref.
  const rotation = useRef(0);
  const wheelRef = useRef<SVGSVGElement>(null);
  const frame = useRef(0);

  useEffect(() => {
    setOptions(readOptions());
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => { media.removeEventListener('change', update); cancelAnimationFrame(frame.current); };
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
    // Labels run along the radius, ending near the rim, so the winner (stopped at the 3 o'clock pointer) reads left to right.
    const [tx, ty] = pointOnWheel(150, 150, 128, middle);
    return { label, path, tx, ty, middle, index, color: sliceColor(index, count) };
  }), [options]);

  function addOptions(raw: string) {
    const added = raw.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    if (added.length) setOptions((current) => [...current, ...added]);
    setDraft('');
  }

  function setWheelRotation(angle: number) {
    rotation.current = angle;
    if (wheelRef.current) wheelRef.current.style.transform = `rotate(${angle}deg)`;
  }

  function settle(winnerIndex: number) {
    setWinner(options[winnerIndex]!);
    setSpinning(false);
    // A removed winner has nothing left to mark: keeping its index would highlight the option that moved into its place.
    if (removeWinnerRef.current) setOptions((current) => current.filter((_, optionIndex) => optionIndex !== winnerIndex));
    else setHighlight(winnerIndex);
  }

  function spin() {
    if (spinning || options.length < 2) return;
    const count = options.length;
    // The winner is a uniform pick; turns and the spot inside the slice only change how the landing looks.
    const winnerIndex = randomIndex(count);
    const turns = 5 + randomIndex(3);
    const offset = landingOffset(randomIndex(10_000) / 10_000);
    const start = rotation.current;
    const target = rotationForWinner(winnerIndex, count, turns, offset);
    const end = start + ((target - start) % 360 + 360) % 360 + turns * 360;
    setHighlight(null);
    setWinner(null);
    setSpinning(true);

    if (reducedMotion) {
      setWheelRotation(end);
      window.setTimeout(() => settle(winnerIndex), REDUCED_MS);
      return;
    }
    const began = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - began) / SPIN_MS);
      const angle = start + (end - start) * easeOut(t);
      setWheelRotation(angle);
      if (t < 1) frame.current = requestAnimationFrame(step);
      else settle(winnerIndex);
    };
    frame.current = requestAnimationFrame(step);
  }

  const settled = highlight !== null && !spinning;

  return <section className={styles.widget} aria-label="Decision wheel">
    <div className={styles.wheelWrap}>
      <svg className={styles.pointer} viewBox="0 0 34 32" aria-hidden="true"><path d="M4.5 13.2 26.8 2.6c2.6-1.2 5.2.9 5.2 3.6v19.6c0 2.7-2.6 4.8-5.2 3.6L4.5 18.8c-2.3-1.1-2.3-4.5 0-5.6Z" /></svg>
      <svg ref={wheelRef} className={`${styles.wheel} ${spinning && reducedMotion ? styles.fading : ''}`} viewBox="0 0 300 300" role="img" aria-label={`Wheel with ${options.length} options`}>
        <circle cx="150" cy="150" r="144" className={styles.rim} />
        {slices.map((slice) => <g key={`${slice.index}-${slice.label}`} className={settled && highlight !== slice.index ? styles.dim : ''}>
          <path d={slice.path} fill={slice.color} className={styles.slice} />
          <text x={slice.tx} y={slice.ty} transform={`rotate(${slice.middle - 90} ${slice.tx} ${slice.ty})`} textAnchor="end" dominantBaseline="middle" className={styles.label}>{slice.label.length > 14 ? `${slice.label.slice(0, 13)}…` : slice.label}</text>
        </g>)}
        <circle cx="150" cy="150" r="16" className={styles.hub} />
      </svg>
      <div className={`${styles.resultCard} ${winner ? styles.shown : ''}`} role="status" aria-live="polite" aria-atomic="true">
        {winner && <>
          <span className={styles.resultLabel}>The wheel landed on</span>
          <strong className={styles.resultName}>{winner}</strong>
          <button type="button" className={styles.resultClose} onClick={() => { setWinner(null); setHighlight(null); }} aria-label="Hide result">×</button>
        </>}
      </div>
    </div>
    <div className={styles.controls}>
      <button className="btn btn-primary" type="button" onClick={spin} disabled={spinning || options.length < 2}>Spin</button>
      <label className={styles.removeToggle}><input type="checkbox" checked={removeWinner} onChange={(event) => setRemoveWinner(event.currentTarget.checked)} /> Remove winner after spin</label>
      <form className={styles.addForm} onSubmit={(event) => { event.preventDefault(); if (!spinning) addOptions(draft); }}>
        <label htmlFor="wheel-option" className={styles.inputLabel}>Add an option (paste multiple lines to add several)</label>
        <div className={styles.inputRow}><textarea id="wheel-option" value={draft} onChange={(event) => setDraft(event.currentTarget.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); if (!spinning) addOptions(draft); } }} rows={2} placeholder="Type or paste options" disabled={spinning} /><button className="btn btn-ghost" type="submit" disabled={spinning || !draft.trim()}>Add</button></div>
      </form>
      <ul className={styles.options} aria-label="Wheel options">{options.map((option, index) => <li key={`${index}-${option}`} className={highlight === index ? styles.winner : ''}><span className={styles.swatch} style={{ background: sliceColor(index, options.length) }} aria-hidden="true" /><span className={styles.optionText}>{option}</span><button type="button" aria-label={`Remove ${option}`} disabled={spinning} onClick={() => { setOptions((current) => current.filter((_, itemIndex) => itemIndex !== index)); setHighlight(null); setWinner(null); }}>×</button></li>)}</ul>
      <button className={styles.clear} type="button" onClick={() => { setOptions([]); setHighlight(null); setWinner(null); }} disabled={spinning || options.length === 0}>Clear all options</button>
    </div>
  </section>;
}
