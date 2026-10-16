export interface WidgetInfo {
  slug: 'rubik' | 'roulette' | 'pomodoro';
  name: string;
  /** Compact label for the switcher shown on widget pages. */
  short: string;
  description: string;
}

export const WIDGETS: WidgetInfo[] = [
  { slug: 'rubik', name: "Rubik's Cube Timer", short: 'Rubik', description: 'A focused timer for your next solve.' },
  { slug: 'roulette', name: 'Roulette', short: 'Roulette', description: 'A simple picker when you cannot decide.' },
  { slug: 'pomodoro', name: 'Pomodoro', short: 'Pomodoro', description: 'A timer for focused work and breaks.' },
];
