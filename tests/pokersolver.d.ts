// Minimal types for pokersolver, used only as an independent reference in the poker engine tests.
declare module 'pokersolver' {
  interface SolvedHand {
    name: string;
    descr: string;
    rank: number;
  }
  const pokersolver: {
    Hand: {
      solve(cards: string[]): SolvedHand;
      winners(hands: SolvedHand[]): SolvedHand[];
    };
  };
  export default pokersolver;
}
