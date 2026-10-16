// Poker engine correctness. These run in Node (no browser): hand rankings, kickers, splits, deal counting, exact and
// simulated equity, checked against combinatorial ground truth, an independent evaluator (pokersolver) and published
// exact matchup totals.
import { expect, test } from '@playwright/test';
import pokersolver from 'pokersolver';
import { type Card, cardCode, DECK, parseCard, parseCards } from '../src/widgets/poker/engine/cards';
import { bestFive, categoryOf, describeHand, evaluate, HAND_CATEGORIES } from '../src/widgets/poker/engine/evaluate';
import { countDeals, exactEquity, simulateEquity, validateScenario, type EquityResult, type Scenario } from '../src/widgets/poker/engine/equity';
import { seededRandom } from '../src/widgets/poker/engine/random';

const { Hand } = pokersolver;
const score = (codes: string) => evaluate(parseCards(codes));

/** Win, tie and lose add up to 1 for everyone, equity sits between win and win + tie, and equities sum to 1. */
function expectConsistent(result: EquityResult) {
  for (const stats of [result.hero, ...result.opponents]) {
    expect(stats.win + stats.tie + stats.lose).toBeCloseTo(1, 12);
    expect(stats.equity).toBeGreaterThanOrEqual(stats.win - 1e-12);
    expect(stats.equity).toBeLessThanOrEqual(stats.win + stats.tie + 1e-12);
  }
  expect([result.hero, ...result.opponents].reduce((sum, stats) => sum + stats.equity, 0)).toBeCloseTo(1, 9);
}

/** Exact equity by brute force with pokersolver deciding every showdown: an independent reference implementation. */
function referenceEquity(scenario: Scenario): { wins: number[]; ties: number[]; shares: number[]; deals: number } {
  const players = [scenario.hero, ...scenario.opponents.map((hand) => hand!)];
  const used = new Set([...scenario.board, ...players.flat()]);
  const deck = DECK.filter((card) => !used.has(card));
  const wins = players.map(() => 0), ties = players.map(() => 0), shares = players.map(() => 0);
  let deals = 0;
  const visit = (start: number, board: Card[]) => {
    if (board.length === 5) {
      const hands = players.map((hole) => Hand.solve([...hole, ...board].map(cardCode)));
      const winners = Hand.winners(hands);
      hands.forEach((hand, index) => {
        if (!winners.includes(hand)) return;
        if (winners.length === 1) wins[index]++;
        else ties[index]++;
        shares[index] += 1 / winners.length;
      });
      deals++;
      return;
    }
    for (let i = start; i < deck.length; i++) visit(i + 1, [...board, deck[i]]);
  };
  visit(0, scenario.board);
  expect(deals).toBe(countDeals(scenario));
  return { wins, ties, shares, deals };
}

function expectMatchesReference(scenario: Scenario) {
  const result = exactEquity(scenario);
  const reference = referenceEquity(scenario);
  expect(result.method).toBe('exact');
  expect(result.samples).toBe(reference.deals);
  [result.hero, ...result.opponents].forEach((stats, index) => {
    expect(Math.round(stats.win * result.samples), `wins for player ${index}`).toBe(reference.wins[index]);
    expect(Math.round(stats.tie * result.samples), `ties for player ${index}`).toBe(reference.ties[index]);
    expect(stats.equity * result.samples).toBeCloseTo(reference.shares[index], 6);
  });
  expectConsistent(result);
}

test.describe('hand rankings', () => {
  const examples: [string, string, string][] = [
    ['High card', '2c 5d 9h Js Kc 3d 7s', 'King high'],
    ['Pair', '9c 9d 2h 5s Kc 3d 7s', 'Pair of Nines'],
    ['Two pair', '9c 9d 2h 2s Kc 3d 7s', 'Two pair, Nines and Twos'],
    ['Three of a kind', '9c 9d 9h 2s Kc 3d 7s', 'Three of a kind, Nines'],
    ['Straight', '5c 6d 7h 8s 9c 2d Ks', 'Straight, Nine high'],
    ['Straight', 'Ac 2d 3h 4s 5c 9d Ks', 'Straight, Five high'],
    ['Flush', '2h 5h 9h Jh Kh 3d 7s', 'Flush, King high'],
    ['Full house', '9c 9d 9h 2s 2c 3d 7s', 'Full house, Nines full of Twos'],
    ['Four of a kind', '9c 9d 9h 9s Kc 3d 7s', 'Four of a kind, Nines'],
    ['Straight flush', '5h 6h 7h 8h 9h 2d Ks', 'Straight flush, Nine high'],
    ['Straight flush', 'Ts Js Qs Ks As 2d 3c', 'Royal flush'],
  ];
  for (const [category, codes, description] of examples) {
    test(`${description} is a ${category.toLowerCase()}`, () => {
      expect(categoryOf(score(codes))).toBe(category);
      expect(describeHand(score(codes))).toBe(description);
    });
  }

  test('every category beats the one below it', () => {
    const ladder = ['Ac Kd 9h 7s 5c 3d 2s', '2c 2d Ah Ks Qc 9d 7s', '2c 2d 3h 3s Ac Kd 9s', '2c 2d 2h As Kc 9d 7s', '2c 3d 4h 5s 6c 9d Ks',
      '2h 4h 6h 8h Th Kd As', '2c 2d 2h 3s 3c 9d Ks', '2c 2d 2h 2s 3c 9d Ks', '2h 3h 4h 5h 6h 9d Ks'];
    const scores = ladder.map(score);
    expect(scores.map(categoryOf)).toEqual([...HAND_CATEGORIES]);
    for (let i = 1; i < scores.length; i++) expect(scores[i]).toBeGreaterThan(scores[i - 1]);
  });

  test('kickers decide hands of the same category', () => {
    const beats = (winner: string, loser: string) => expect(score(winner), `${winner} > ${loser}`).toBeGreaterThan(score(loser));
    beats('Ac Ad Kh 9s 7c 3d 2s', 'Ac Ad Qh 9s 7c 3d 2s'); // pair: first kicker
    beats('Ac Ad Kh 9s 7c 3d 2s', 'Ac Ad Kh 9s 6c 3d 2s'); // pair: third kicker
    beats('Kc Kd 5h 5s Ac 3d 2s', 'Kc Kd 5h 5s Qc 3d 2s'); // two pair: kicker
    beats('Kc Kd 5h 5s 3c 3d As', 'Kc Kd 5h 5s 4c 3d 2s'); // three pairs: best kicker may come from the third pair's rank or not
    beats('7c 7d 7h Ks 2c 3d 9s', '7c 7d 7h Qs Jc 3d 9s'); // trips: kicker
    beats('2h 5h 9h Jh Ah 3d 7s', '2h 5h 9h Jh Kh 3d 7s'); // flush: top card
    beats('3h 5h 9h Jh Ah 3d 7s', '2h 5h 9h Jh Ah 3d 7s'); // flush: fifth card
    beats('Ac Kd 9h 7s 5c 3d 2s', 'Ac Kd 9h 7s 4c 3d 2s'); // high card: fifth card
    beats('Kc Kd Kh 2s 2c 3d 9s', 'Qc Qd Qh As Ac 3d 9s'); // full house: trips rank first
    beats('2c 3d 4h 5s 6c Kd Qs', 'Ac 2d 3h 4s 5c Kd Qs'); // six-high straight beats the wheel
    beats('9c 9d 9h 9s Ac 3d 2s', '9c 9d 9h 9s Kc 3d 2s'); // quads: kicker
    expect(score('Kc Kd 5h 5s 3c 3d As')).toBe(score('Kc Kd 5h 5s Ac 9d 7s')); // only the best five cards count
  });

  test('when the board plays, both players split', () => {
    const board = 'Ts Js Qs Ks As';
    expect(score(`2c 3d ${board}`)).toBe(score(`4h 5c ${board}`));
    expect(score('2c 3d 9c 9d 9h Kc Ks')).toBe(score('4c 5d 9c 9d 9h Kc Ks'));
  });

  test('all 2,598,960 five-card hands fall into the known category counts', () => {
    const counts = new Array(HAND_CATEGORIES.length).fill(0);
    const hand = new Int32Array(5);
    for (let a = 0; a < 52; a++) for (let b = a + 1; b < 52; b++) for (let c = b + 1; c < 52; c++)
      for (let d = c + 1; d < 52; d++) for (let e = d + 1; e < 52; e++) {
        hand[0] = a; hand[1] = b; hand[2] = c; hand[3] = d; hand[4] = e;
        counts[evaluate(hand) >> 20]++;
      }
    expect(counts).toEqual([1_302_540, 1_098_240, 123_552, 54_912, 10_200, 5_108, 3_744, 624, 40]);
  });

  test('agrees with pokersolver on 20,000 random seven-card showdowns', () => {
    const random = seededRandom(20241011);
    const deck = [...DECK];
    for (let round = 0; round < 20_000; round++) {
      for (let i = 0; i < 9; i++) { const j = i + Math.floor(random() * (52 - i)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
      const board = deck.slice(4, 9);
      const first = [deck[0], deck[1], ...board];
      const second = [deck[2], deck[3], ...board];
      const firstSolved = Hand.solve(first.map(cardCode));
      const secondSolved = Hand.solve(second.map(cardCode));
      const winners = Hand.winners([firstSolved, secondSolved]);
      const expected = winners.length === 2 ? 0 : winners[0] === firstSolved ? 1 : -1;
      const label = `${first.map(cardCode).join(' ')} vs ${second.map(cardCode).join(' ')}`;
      expect(Math.sign(evaluate(first) - evaluate(second)), label).toBe(expected);
      // Same category name too (pokersolver calls the ace-high straight flush "Royal Flush").
      expect(categoryOf(evaluate(first)).toLowerCase(), label).toBe(firstSolved.name.toLowerCase().replace('royal flush', 'straight flush'));
    }
  });

  test('best five cards are the ones that make the hand, in reading order', () => {
    expect(bestFive(parseCards('Ac 2d 3h 4s 5c Kd Qs')).cards.map(cardCode)).toEqual(['5c', '4s', '3h', '2d', 'Ac']);
    expect(bestFive(parseCards('2c 2d Kh Ks Kc 9d 7s')).cards.map(cardCode)).toEqual(['Ks', 'Kh', 'Kc', '2d', '2c']);
    const flush = bestFive(parseCards('2h 5h 9h Jh Kh 3h As'));
    expect(flush.cards.map(cardCode)).toEqual(['Kh', 'Jh', '9h', '5h', '3h']);
    expect(describeHand(flush.score)).toBe('Flush, King high');
  });
});

test.describe('scenario validation', () => {
  const base: Scenario = { hero: parseCards('As Kd'), board: [], opponents: [null] };

  test('a complete scenario has no problems', () => {
    expect(validateScenario(base)).toEqual([]);
    expect(validateScenario({ ...base, board: parseCards('2c 7d 9h') })).toEqual([]);
  });

  test('incomplete and invalid scenarios are reported', () => {
    const codes = (scenario: Scenario) => validateScenario(scenario).map((problem) => problem.code);
    expect(codes({ ...base, hero: parseCards('As') })).toEqual(['hero-incomplete']);
    expect(codes({ ...base, board: parseCards('2c 7d') })).toEqual(['board-incomplete']);
    expect(codes({ ...base, opponents: [parseCards('Qh')] })).toEqual(['opponent-incomplete']);
    expect(codes({ ...base, opponents: [] })).toEqual(['no-opponents']);
    expect(codes({ ...base, opponents: Array(10).fill(null) })).toEqual(['too-many-opponents']);
    expect(codes({ ...base, board: parseCards('As 7d 9h') })).toEqual(['duplicate-card']);
    expect(codes({ ...base, opponents: [parseCards('Kd 2c')] })).toEqual(['duplicate-card']);
  });

  test('calculations refuse invalid scenarios', () => {
    expect(() => exactEquity({ ...base, board: parseCards('As 7d 9h') })).toThrow(/same card/);
    expect(() => simulateEquity({ ...base, hero: [] }, 10, seededRandom(1))).toThrow(/hole cards/);
  });
});

test.describe('exact equity', () => {
  test('counts deals: board completions times hands for each random opponent', () => {
    expect(countDeals({ hero: parseCards('As Ks'), board: [], opponents: [parseCards('Qd Qc')] })).toBe(1_712_304);
    expect(countDeals({ hero: parseCards('As Ks'), board: parseCards('Qs 7d 2s'), opponents: [null] })).toBe(1081 * 990);
    expect(countDeals({ hero: parseCards('As Ks'), board: parseCards('Qs 7d 2s 9c 3h'), opponents: [null, null] })).toBe(990 * 903);
  });

  test('a decided river: the better hand wins every time', () => {
    const result = exactEquity({ hero: parseCards('Ah Ad'), board: parseCards('2c 7d 9h Js Qc'), opponents: [parseCards('Kh Kd')] });
    expect(result).toMatchObject({ method: 'exact', samples: 1, hero: { win: 1, tie: 0, lose: 0, equity: 1 } });
    expect(result.opponents[0]).toEqual({ win: 0, tie: 0, lose: 1, equity: 0 });
  });

  test('a board that plays splits the pot: ties count as shares, not wins', () => {
    const result = exactEquity({ hero: parseCards('2c 3d'), board: parseCards('Ts Js Qs Ks As'), opponents: [parseCards('4h 5c'), parseCards('6d 7h')] });
    for (const stats of [result.hero, ...result.opponents]) expect(stats).toEqual({ win: 0, tie: 1, lose: 0, equity: 1 / 3 });
  });

  test('turn, three known hands: matches an independent pokersolver enumeration', () => {
    expectMatchesReference({ hero: parseCards('Ah Kh'), board: parseCards('Qh Jd 2h 7c'), opponents: [parseCards('Qs Qd'), parseCards('Tc 9c')] });
  });

  test('flop, heads up: matches an independent pokersolver enumeration over all 990 run-outs', () => {
    expectMatchesReference({ hero: parseCards('As Ks'), board: parseCards('Qs 7d 2s'), opponents: [parseCards('7h 7c')] });
  });

  test('river against a random hand: every one of the 990 possible hands is counted', () => {
    const hero = parseCards('Ah Kd');
    const board = parseCards('As 7d 9h Js 2c');
    const result = exactEquity({ hero, board, opponents: [null] });
    // Reference: try every opponent hand with pokersolver.
    const used = new Set([...hero, ...board]);
    const deck = DECK.filter((card) => !used.has(card));
    let wins = 0, ties = 0;
    const heroHand = Hand.solve([...hero, ...board].map(cardCode));
    for (let i = 0; i < deck.length; i++) for (let j = i + 1; j < deck.length; j++) {
      const villain = Hand.solve([deck[i], deck[j], ...board].map(cardCode));
      const winners = Hand.winners([heroHand, villain]);
      if (winners.length === 2) ties++;
      else if (winners[0] === heroHand) wins++;
    }
    expect(result.samples).toBe(990);
    expect(Math.round(result.hero.win * 990)).toBe(wins);
    expect(Math.round(result.hero.tie * 990)).toBe(ties);
    expectConsistent(result);
  });

  test('multiway with random opponents: identical random seats get identical results', () => {
    const result = exactEquity({ hero: parseCards('Qh Qd'), board: parseCards('Ks 8c 3d 9h 2s'), opponents: [null, null] });
    expect(result.samples).toBe(990 * 903);
    expect(result.opponents[0].win).toBeCloseTo(result.opponents[1].win, 12);
    expect(result.opponents[0].equity).toBeCloseTo(result.opponents[1].equity, 12);
    expectConsistent(result);
  });

  test('preflop QQ vs AKs over all 24 suit combinations matches CardFight\'s published exact totals', () => {
    // https://www.cardfight.com/QQ_AKs.html — QQ wins 22,082,460 and AKs 18,834,720 of the 24 × 1,712,304 deals.
    const suits = 'shdc';
    let queensWin = 0, aceKingWins = 0, deals = 0;
    for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) for (const s of suits) {
      const result = exactEquity({ hero: [parseCard('Q' + suits[a]), parseCard('Q' + suits[b])], board: [], opponents: [[parseCard('A' + s), parseCard('K' + s)]] });
      queensWin += Math.round(result.hero.win * result.samples);
      aceKingWins += Math.round(result.opponents[0].win * result.samples);
      deals += result.samples;
    }
    expect(deals).toBe(24 * 1_712_304);
    expect(queensWin).toBe(22_082_460);
    expect(aceKingWins).toBe(18_834_720);
  });
});

test.describe('hand odds', () => {
  const category = (name: (typeof HAND_CATEGORIES)[number]) => HAND_CATEGORIES.indexOf(name);
  const flushDraw: Scenario = { hero: parseCards('As Ks'), board: parseCards('Qs 7d 2s'), opponents: [null] };

  test('a flush draw on the flop: exact chances of finishing with each hand', () => {
    // 9 spades among 47 unseen cards: 1 − C(38,2)/C(47,2) = 378 of 1,081 run-outs make a flush, and exactly one of them
    // (Js Ts) is a royal flush. A full house or quads can't be made with two cards to come.
    const { heroHands } = exactEquity(flushDraw);
    expect(heroHands[category('Flush')]).toBeCloseTo(377 / 1081, 12);
    expect(heroHands[category('Straight flush')]).toBeCloseTo(1 / 1081, 12);
    expect(heroHands[category('Full house')]).toBe(0);
    expect(heroHands[category('Four of a kind')]).toBe(0);
    expect(heroHands.reduce((sum, chance) => sum + chance, 0)).toBeCloseTo(1, 12);
  });

  test('a known opponent\'s cards are dead: their spades shrink your flush odds', () => {
    // 8s 9s with the opponent leaves 7 spades among 45 cards: 1 − C(38,2)/C(45,2) = 287 of 990, one of them the royal.
    const { heroHands } = exactEquity({ ...flushDraw, opponents: [parseCards('8s 9s')] });
    expect(heroHands[category('Flush')]).toBeCloseTo(286 / 990, 12);
    expect(heroHands[category('Straight flush')]).toBeCloseTo(1 / 990, 12);
  });

  test('simulated hand odds converge on the exact ones', () => {
    const exact = exactEquity(flushDraw).heroHands;
    const trials = 200_000;
    const simulated = simulateEquity(flushDraw, trials, seededRandom(11)).heroHands;
    exact.forEach((chance, index) => {
      const standardError = Math.sqrt((chance * (1 - chance)) / trials);
      expect(Math.abs(simulated[index] - chance), HAND_CATEGORIES[index]).toBeLessThanOrEqual(4 * standardError + 1e-9);
    });
  });
});

test.describe('simulated equity', () => {
  const scenario: Scenario = { hero: parseCards('As Ks'), board: parseCards('Qs 7d 2s'), opponents: [null] };

  test('is reproducible with a seed', () => {
    expect(simulateEquity(scenario, 20_000, seededRandom(7))).toEqual(simulateEquity(scenario, 20_000, seededRandom(7)));
  });

  test('converges on the exact answer within its stated error', () => {
    const exact = exactEquity(scenario);
    const simulated = simulateEquity(scenario, 200_000, seededRandom(42));
    expect(simulated.method).toBe('simulation');
    expect(simulated.samples).toBe(200_000);
    expect(simulated.heroStandardError).toBeGreaterThan(0);
    // Seeded, so deterministic; 4 standard errors leaves no room for a real bias to hide.
    expect(Math.abs(simulated.hero.equity - exact.hero.equity)).toBeLessThan(4 * simulated.heroStandardError!);
    expectConsistent(simulated);
  });

  test('multiway preflop: nine opponents, results stay consistent', () => {
    const result = simulateEquity({ hero: parseCards('Ah Ad'), board: [], opponents: Array(9).fill(null) }, 50_000, seededRandom(3));
    expect(result.opponents).toHaveLength(9);
    expect(result.hero.equity).toBeGreaterThan(0.25);
    expect(result.hero.equity).toBeLessThan(0.4);
    expectConsistent(result);
  });

  test('stops early when the batch callback says so', () => {
    let batches = 0;
    const result = simulateEquity(scenario, 100_000, seededRandom(1), () => ++batches < 3, 10_000);
    expect(result.samples).toBe(30_000);
  });
});
