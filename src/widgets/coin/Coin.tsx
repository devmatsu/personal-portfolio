import { useEffect, useRef, useState } from 'react';
import styles from './coin.module.css';
import CoinFace from './CoinFace';
import { randomIndex } from '../random';
import { hasModifier, isShortcutTarget } from '../shortcuts';

const SIDES = [{ name: 'Heads', value: 1 }, { name: 'Tails', value: 2 }] as const;
type Side = (typeof SIDES)[number];
const FLIP_MS = 1100;
const REDUCED_MS = 180;
const TURNS = 5;
// Thin discs stacked between the two faces give the coin its thickness (and reeded edge) while it turns.
const EDGE_SLICES = Array.from({ length: 17 }, (_, index) => (index - 8) * 0.75);

/** Rotation that adds full turns end over end and finishes with the given side up: Heads at 0°, Tails at 180°. */
function landingRotation(current: number, sideIndex: number): number {
  const target = sideIndex * 180;
  return current + TURNS * 360 + ((target - (current % 360)) + 360) % 360;
}

export default function Coin() {
  const [rotation, setRotation] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<Side | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timer = useRef(0);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => { media.removeEventListener('change', update); window.clearTimeout(timer.current); };
  }, []);

  function flip() {
    if (flipping) return;
    const sideIndex = randomIndex(SIDES.length);
    setResult(null);
    setFlipping(true);
    setRotation((current) => landingRotation(current, sideIndex));
    timer.current = window.setTimeout(() => {
      setResult(SIDES[sideIndex]!);
      setFlipping(false);
    }, reducedMotion ? REDUCED_MS : FLIP_MS);
  }

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat || hasModifier(event) || !isShortcutTarget(event)) return;
      event.preventDefault();
      flip();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  });

  const spin = reducedMotion
    ? { transform: `rotateX(${rotation}deg)`, transition: `opacity ${REDUCED_MS}ms ease-out`, opacity: flipping ? 0.55 : 1 }
    : { transform: `rotateX(${rotation}deg)`, transition: `transform ${FLIP_MS}ms cubic-bezier(.2,.7,.25,1)` };

  return <section className={styles.widget} aria-label="Coin flip">
    <div className={`${styles.table} ${flipping && !reducedMotion ? styles.tossing : ''}`}>
      <span className={styles.shadow} aria-hidden="true" />
      <button type="button" className={styles.stage} onClick={flip} disabled={flipping} aria-label="Flip the coin">
        <span className={styles.lift} aria-hidden="true">
          <span className={styles.spin} style={spin}>
            {EDGE_SLICES.map((z) => <span key={z} className={styles.slice} style={{ transform: `translateZ(${z}px)` }} />)}
            {SIDES.map((side, index) => <span key={side.name} className={`${styles.face} ${index === 1 ? styles.tails : styles.heads}`}>
              <CoinFace word={side.name.toUpperCase()} value={side.value} />
            </span>)}
          </span>
        </span>
      </button>
    </div>
    <p className={styles.result} aria-live="polite" aria-atomic="true">
      {result ? <><span className={styles.word}>{result.name}</span> <span className={styles.value}>{result.value}</span></> : flipping ? 'Flipping…' : ''}
    </p>
    <button className="btn btn-primary" type="button" onClick={flip} disabled={flipping}>Flip</button>
    <p className={styles.hint}>Space or tap the coin to flip</p>
  </section>;
}
