import { useId } from 'react';

// One face of a silver coin, drawn in a 200×200 box: reeded rim, beaded ring, and embossed lettering
// (a specular-lighting filter lifts the design off the metal, lit from the top left like the page's light).
// Silver isn't a site token; it's the coin's material, so its colours live here.
const METAL = { hi: '#FFFFFF', mid: '#C9CDD3', lo: '#7D838C', deep: '#4E535B', ink: '#5A6069' };
const point = (radius: number, degrees: number) => {
  const radians = (degrees * Math.PI) / 180;
  return [100 + radius * Math.cos(radians), 100 + radius * Math.sin(radians)] as const;
};
const RIDGES = Array.from({ length: 120 }, (_, index) => [point(93, index * 3), point(99, index * 3)] as const);
const BEADS = Array.from({ length: 60 }, (_, index) => point(82, index * 6));

export default function CoinFace({ word, value }: { word: string; value: number }) {
  // useId can contain characters that aren't valid in url(#…) references.
  const id = `coin${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id={`${id}-metal`} cx="35%" cy="28%" r="80%">
        <stop offset="0" stopColor={METAL.hi} /><stop offset=".45" stopColor={METAL.mid} /><stop offset="1" stopColor={METAL.lo} />
      </radialGradient>
      <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={METAL.hi} /><stop offset=".5" stopColor={METAL.lo} /><stop offset="1" stopColor={METAL.deep} />
      </linearGradient>
      <filter id={`${id}-emboss`} x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.1" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="2.4" specularConstant=".9" specularExponent="18" lightingColor="#fff" result="light">
          <feDistantLight azimuth="225" elevation="42" />
        </feSpecularLighting>
        <feComposite in="light" in2="SourceAlpha" operator="in" result="lit" />
        <feOffset in="SourceAlpha" dx=".8" dy="1.1" result="offset" />
        <feFlood floodColor="#000" floodOpacity=".35" />
        <feComposite in2="offset" operator="in" result="shadow" />
        <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /><feMergeNode in="lit" /></feMerge>
      </filter>
      {/* The rim legend follows the bottom arc, just inside the beads, and stays clear of the bars. */}
      <path id={`${id}-arc`} d="M 26 100 A 74 74 0 0 0 174 100" fill="none" />
    </defs>
    <circle cx="100" cy="100" r="99" fill={`url(#${id}-rim)`} />
    <g stroke={METAL.deep} strokeWidth="1.2" opacity=".55">
      {RIDGES.map(([[x1, y1], [x2, y2]], index) => <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} />)}
    </g>
    <circle cx="100" cy="100" r="91" fill={`url(#${id}-metal)`} />
    <circle cx="100" cy="100" r="88.5" fill="none" stroke={METAL.hi} strokeOpacity=".5" />
    <g fill={METAL.ink} fontFamily="Georgia, 'Times New Roman', serif" filter={`url(#${id}-emboss)`}>
      {BEADS.map(([cx, cy], index) => <circle key={index} cx={cx} cy={cy} r="1.25" />)}
      <text fontSize="9" fontWeight="600" letterSpacing="2.5" textAnchor="middle" opacity=".75">
        <textPath href={`#${id}-arc`} startOffset="50%">DEVMATSU · MMXXVI</textPath>
      </text>
      <text x="100" y="66" fontSize="12" textAnchor="middle" opacity=".75">★</text>
      <rect x="42" y="78" width="116" height="2.5" rx="1" />
      <text x="100" y="112" fontSize="31" fontWeight="800" textAnchor="middle" letterSpacing="2">{word}</text>
      <rect x="42" y="121" width="116" height="2.5" rx="1" />
      <text x="100" y="146" fontSize="13" fontWeight="600" textAnchor="middle" opacity=".75">{value}</text>
    </g>
  </svg>;
}
