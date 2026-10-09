export interface WidgetInfo {
  slug: 'rubik' | 'roulette' | 'pomodoro';
  name: string;
  description: string;
}

export const WIDGETS: WidgetInfo[] = [
  { slug: 'rubik', name: "Rubik's Cube Timer", description: 'A focused timer for your next solve.' },
  { slug: 'roulette', name: 'Roulette', description: 'A simple picker when you cannot decide.' },
  { slug: 'pomodoro', name: 'Pomodoro', description: 'A timer for focused work and breaks.' },
];
