export interface WidgetInfo {
  slug: 'rubik' | 'wheel' | 'pomodoro' | 'poker' | 'coin';
  name: string;
  /** Compact label for the switcher shown on widget pages. */
  short: string;
  description: string;
}

export const WIDGETS: WidgetInfo[] = [
  { slug: 'rubik', name: "Rubik's Cube Timer", short: 'Rubik', description: 'A focused timer for your next solve.' },
  { slug: 'wheel', name: 'Wheel', short: 'Wheel', description: 'A simple picker when you cannot decide.' },
  { slug: 'pomodoro', name: 'Pomodoro', short: 'Pomodoro', description: 'A timer for focused work and breaks.' },
  { slug: 'poker', name: 'Poker Odds', short: 'Poker', description: "Hold'em equity street by street for you and up to nine opponents, with the outs that would put each player ahead." },
  { slug: 'coin', name: 'Coin Flip', short: 'Coin', description: 'Heads or tails in one tap. Nothing to choose, just flip.' },
];
