import { type Position, type HandNotation } from '../types'
import type { Range } from '../types'
import { approxEquityVsRandom, randomHandWeighted } from './poker'
import type { Card } from './cards'

export type TrainerScenarioType = 'rfi' | 'push-fold' | 'vs3bet' | 'cbet' | 'face-bet'

export interface EVOption {
  id: string
  label: string
  ev: number
  freq: number
  explanation: string
}

export interface TrainerScenario {
  id: string
  type: TrainerScenarioType
  heroHand: HandNotation
  heroCards: [Card, Card]
  heroPosition: Position
  villainPosition?: Position
  stackBB: number
  board: Card[]
  pot: number
  betSize: number
  title: string
  description: string
  options: EVOption[]
  bestOptionId: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const POSITIONS_RFI: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB']

// Fold equity when hero opens — fraction of the time opponents fold preflop
const RFI_FE: Partial<Record<Position, number>> = {
  UTG: 0.45, 'UTG+1': 0.47, MP: 0.48, HJ: 0.50, CO: 0.54, BTN: 0.44, SB: 0.38,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SUITS = ['h', 'd', 's', 'c'] as const
type Suit = typeof SUITS[number]

function rnd<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomSuit(): Suit { return rnd(SUITS) }

function handToCards(hand: HandNotation): [Card, Card] {
  const r1 = hand[0]
  const r2 = hand[1]
  const isPair = hand.length === 2
  if (isPair || !hand.endsWith('s')) {
    // pair or offsuit: two different suits
    const s1 = randomSuit()
    let s2 = randomSuit()
    while (s2 === s1) s2 = randomSuit()
    return [`${r1}${s1}` as Card, `${r2}${s2}` as Card]
  }
  // suited: same suit
  const s = randomSuit()
  return [`${r1}${s}` as Card, `${r2}${s}` as Card]
}

function randomCard(excluded: Set<Card>): Card {
  const ranks = 'AKQJT98765432'
  const suits = 'hdsc'
  let card: Card
  let attempts = 0
  do {
    card = `${ranks[Math.floor(Math.random() * 13)]}${suits[Math.floor(Math.random() * 4)]}` as Card
    attempts++
  } while (excluded.has(card) && attempts < 52)
  return card
}

function generateFlop(heroCards: [Card, Card]): [Card, Card, Card] {
  const used = new Set<Card>(heroCards)
  const c1 = randomCard(used); used.add(c1)
  const c2 = randomCard(used); used.add(c2)
  const c3 = randomCard(used)
  return [c1, c2, c3]
}

// approxEquityVsRandom returns 0–100; convert to 0–1
function equity(hand: HandNotation): number {
  return approxEquityVsRandom(hand) / 100
}

// Adjust equity when hero hits the flop
function flopEquity(hand: HandNotation, heroCards: [Card, Card], board: [Card, Card, Card]): number {
  const base = equity(hand)
  const br = board.map(c => c[0])
  let bonus = 0
  if (br.includes(heroCards[0][0])) bonus += 0.10
  if (br.includes(heroCards[1][0])) bonus += 0.07
  if (hand.endsWith('s')) {
    const hs = heroCards[0][1]
    const matches = board.filter(c => c[1] === hs).length
    if (matches >= 2) bonus += 0.08
  }
  return Math.min(0.82, Math.max(0.15, base + bonus))
}

function pickHand(ranges: Range[], position: Position, stackKey: string): HandNotation {
  const range = ranges.find(r => r.position === position && r.stackSize === stackKey)
  if (range) {
    const entries = Object.values(range.hands)
    if (entries.length > 0) return rnd(entries).hand
  }
  return randomHandWeighted()
}

// Compute GTO frequencies from a map of option-id → EV
// Best option gets lion's share; mixed if EVs are close
function toFreqs(evMap: Record<string, number>): Record<string, number> {
  const ids = Object.keys(evMap)
  const maxEV = Math.max(...Object.values(evMap))
  const freqs: Record<string, number> = {}
  // classify options
  const dominant: string[] = []
  const mixed: string[] = []
  ids.forEach(id => {
    const diff = maxEV - evMap[id]
    if (diff < 0.15) dominant.push(id)
    else if (diff < 0.5) mixed.push(id)
  })
  if (dominant.length === 1) {
    freqs[dominant[0]] = mixed.length > 0 ? 80 : 100
    mixed.forEach(id => { freqs[id] = Math.round(20 / mixed.length) })
    ids.filter(id => !dominant.includes(id) && !mixed.includes(id)).forEach(id => { freqs[id] = 0 })
  } else {
    // two options very close — split proportionally
    const total = dominant.reduce((s, id) => s + (evMap[id] + 20), 0)
    dominant.forEach(id => { freqs[id] = Math.round(((evMap[id] + 20) / total) * 100) })
    ids.filter(id => !dominant.includes(id)).forEach(id => { freqs[id] = 0 })
  }
  return freqs
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// ─── RFI (Raise First In) ────────────────────────────────────────────────────

function generateRFI(ranges: Range[]): TrainerScenario {
  const pos = rnd(POSITIONS_RFI)
  const hand = pickHand(ranges, pos, '100bb')
  const cards = handToCards(hand)
  const eq = equity(hand)
  const fe = RFI_FE[pos] ?? 0.45
  // open to 2.5bb, win 1.5bb blinds if fold, play for 5.5bb pot if called
  const openSize = 2.5
  const evOpen = fe * 1.5 + (1 - fe) * (eq * 5.5 - openSize)
  const evFold = 0

  const rangeEntry = ranges.find(r => r.position === pos && r.stackSize === '100bb')?.hands[hand]
  const gtoOpen = rangeEntry
    ? (rangeEntry.frequency ?? (evOpen > 0 ? 100 : 0))
    : evOpen > 0.2 ? 100 : evOpen > -0.1 ? 60 : 0

  const bestId = evOpen >= evFold ? 'open' : 'fold'
  return {
    id: makeId(), type: 'rfi', heroHand: hand, heroCards: cards,
    heroPosition: pos, stackBB: 100, board: [], pot: 1.5, betSize: 0,
    title: 'Open ou Fold ?',
    description: `${pos} (100bb). Tout le monde passe avant vous.`,
    options: [
      {
        id: 'open', label: `Open 2.5bb`,
        ev: +evOpen.toFixed(2), freq: Math.round(Math.max(0, Math.min(100, gtoOpen))),
        explanation: evOpen > 0
          ? `EV +${evOpen.toFixed(2)}bb. FE ${Math.round(fe * 100)}% depuis ${pos}, équité ~${Math.round(eq * 100)}% vs range.`
          : `EV légèrement négative depuis ${pos}. Cette main est marginale ici.`,
      },
      {
        id: 'fold', label: 'Fold',
        ev: 0, freq: Math.round(Math.max(0, Math.min(100, 100 - gtoOpen))),
        explanation: 'Pas de dead money investi — fold à 0 EV depuis cette position.',
      },
    ],
    bestOptionId: bestId,
  }
}

// ─── Push / Fold ──────────────────────────────────────────────────────────────

function generatePushFold(ranges: Range[]): TrainerScenario {
  const pos = rnd(POSITIONS_RFI)
  const stackBB = rnd([8, 10, 12, 15, 18, 20] as const)
  const hand = pickHand(ranges, pos, `${stackBB}bb`)
  const cards = handToCards(hand)
  const eq = equity(hand)
  // FE rises with stack (deeper stack = more fold equity)
  const fe = Math.min(0.62, 0.22 + (stackBB - 8) * 0.025)
  const evPush = fe * 1.5 + (1 - fe) * (eq * 2 * stackBB - stackBB)
  const evFold = pos === 'SB' ? -0.5 : 0

  const bestId = evPush >= evFold ? 'push' : 'fold'
  return {
    id: makeId(), type: 'push-fold', heroHand: hand, heroCards: cards,
    heroPosition: pos, stackBB, board: [], pot: 1.5, betSize: 0,
    title: 'Push ou Fold ?',
    description: `Stack ${stackBB}bb en ${pos}. Pas d'ouvreur avant vous.`,
    options: [
      {
        id: 'push', label: `All-in ${stackBB}bb`,
        ev: +evPush.toFixed(2),
        freq: evPush >= evFold + 0.5 ? 100 : evPush >= evFold ? 70 : 20,
        explanation: `EV = FE(${Math.round(fe * 100)}%) × 1.5bb + (1-FE) × (${Math.round(eq * 100)}% × ${2 * stackBB}bb − ${stackBB}bb)`,
      },
      {
        id: 'fold', label: 'Fold',
        ev: +evFold.toFixed(2),
        freq: evPush >= evFold + 0.5 ? 0 : evPush >= evFold ? 30 : 80,
        explanation: pos === 'SB' ? 'Fold coûte la SB (−0.5bb).' : 'Fold = 0 EV depuis cette position.',
      },
    ],
    bestOptionId: bestId,
  }
}

// ─── vs 3-bet ─────────────────────────────────────────────────────────────────

function generateVs3bet(ranges: Range[]): TrainerScenario {
  const heroPos = rnd(['HJ', 'CO', 'BTN'] as const)
  const vilPos: Position = Math.random() < 0.6 ? 'BB' : 'SB'
  const hand = pickHand(ranges, heroPos, '100bb')
  const cards = handToCards(hand)
  const eq = equity(hand)

  const openSize = 2.5
  const threeBet = 11.0
  const callCost = threeBet - openSize       // 8.5
  const potIfCall = openSize + threeBet + callCost  // 22
  const fourBetSize = 25.0
  const fe4bet = 0.45
  const potIf4betCalled = fourBetSize * 2    // 50
  const eqAdj = Math.max(0.20, eq - 0.10)   // equity vs villain's 4bet-call range

  const evFold = -openSize
  const evCall = eq * potIfCall - (openSize + callCost)
  const evFourBet = fe4bet * threeBet + (1 - fe4bet) * (eqAdj * potIf4betCalled - fourBetSize)

  const evMap = { fold: evFold, call: evCall, fourbet: evFourBet }
  const freqs = toFreqs(evMap)
  const maxEV = Math.max(evFold, evCall, evFourBet)
  const bestId = maxEV === evFold ? 'fold' : maxEV === evCall ? 'call' : 'fourbet'
  const potOddsNeeded = Math.round(callCost / potIfCall * 100)

  return {
    id: makeId(), type: 'vs3bet', heroHand: hand, heroCards: cards,
    heroPosition: heroPos, villainPosition: vilPos, stackBB: 100,
    board: [], pot: potIfCall, betSize: threeBet,
    title: 'Face à un 3-bet',
    description: `Vous avez open ${openSize}bb en ${heroPos}. ${vilPos} 3-bet à ${threeBet}bb.`,
    options: [
      {
        id: 'fold', label: 'Fold',
        ev: +evFold.toFixed(2), freq: freqs.fold ?? 0,
        explanation: `On abandonne les ${openSize}bb investis.`,
      },
      {
        id: 'call', label: `Call ${callCost.toFixed(1)}bb`,
        ev: +evCall.toFixed(2), freq: freqs.call ?? 0,
        explanation: `Pot odds ${potOddsNeeded}% — rentable si équité > ${potOddsNeeded}%. Bon avec mains qui réalisent bien leur équité en position.`,
      },
      {
        id: 'fourbet', label: `4-bet ${fourBetSize}bb`,
        ev: +evFourBet.toFixed(2), freq: freqs.fourbet ?? 0,
        explanation: `FE ~${Math.round(fe4bet * 100)}% → gain +${threeBet}bb. Si appel : pot ${potIf4betCalled}bb, équité ajustée ~${Math.round(eqAdj * 100)}%.`,
      },
    ],
    bestOptionId: bestId,
  }
}

// ─── C-bet ────────────────────────────────────────────────────────────────────

function generateCbet(ranges: Range[]): TrainerScenario {
  const heroPos = rnd(['CO', 'BTN'] as const)
  const hand = pickHand(ranges, heroPos, '100bb')
  const cards = handToCards(hand)
  const flop = generateFlop(cards)
  const eq = flopEquity(hand, cards, flop)

  const pot = 5.5
  const bet33 = +(pot * 0.33).toFixed(1)
  const bet50 = +(pot * 0.50).toFixed(1)
  const bet75 = +(pot * 0.75).toFixed(1)
  // Fold equity increases with bet size
  const fe33 = 0.30, fe50 = 0.40, fe75 = 0.52

  const evBet33 = fe33 * pot + (1 - fe33) * (eq * (pot + 2 * bet33) - bet33)
  const evBet50 = fe50 * pot + (1 - fe50) * (eq * (pot + 2 * bet50) - bet50)
  const evBet75 = fe75 * pot + (1 - fe75) * (eq * (pot + 2 * bet75) - bet75)
  const evCheck = eq * pot * 0.88

  const evMap = { bet33: evBet33, bet50: evBet50, bet75: evBet75, check: evCheck }
  const freqs = toFreqs(evMap)
  const maxEV = Math.max(evBet33, evBet50, evBet75, evCheck)
  const bestId = maxEV === evBet33 ? 'bet33' : maxEV === evBet50 ? 'bet50' : maxEV === evBet75 ? 'bet75' : 'check'

  return {
    id: makeId(), type: 'cbet', heroHand: hand, heroCards: cards,
    heroPosition: heroPos, villainPosition: 'BB', stackBB: 100,
    board: flop, pot, betSize: 0,
    title: 'C-bet ou Check ?',
    description: `Vous avez open en ${heroPos}, BB call. Le flop tombe — action sur vous.`,
    options: [
      {
        id: 'bet33', label: `Bet 33% (${bet33}bb)`,
        ev: +evBet33.toFixed(2), freq: freqs.bet33 ?? 0,
        explanation: `Petit bet (FE ~${Math.round(fe33 * 100)}%). Optimal sur boards monotones ou coordonnés pour viser folds immédiats.`,
      },
      {
        id: 'bet50', label: `Bet 50% (${bet50}bb)`,
        ev: +evBet50.toFixed(2), freq: freqs.bet50 ?? 0,
        explanation: `Bet standard (FE ~${Math.round(fe50 * 100)}%). Bon équilibre value/bluff sur la plupart des boards.`,
      },
      {
        id: 'bet75', label: `Bet 75% (${bet75}bb)`,
        ev: +evBet75.toFixed(2), freq: freqs.bet75 ?? 0,
        explanation: `Gros bet (FE ~${Math.round(fe75 * 100)}%). Optimal sur boards secs avec overpairs ou comme bluff sur boards high-card.`,
      },
      {
        id: 'check', label: 'Check',
        ev: +evCheck.toFixed(2), freq: freqs.check ?? 0,
        explanation: `Pot control ou trap. Indispensable pour équilibrer notre range — on ne peut pas toujours c-bet.`,
      },
    ],
    bestOptionId: bestId,
  }
}

// ─── Face a bet ───────────────────────────────────────────────────────────────

function generateFaceBet(ranges: Range[]): TrainerScenario {
  const heroPos = rnd(['BTN', 'CO'] as const)
  const hand = pickHand(ranges, heroPos, '100bb')
  const cards = handToCards(hand)
  const flop = generateFlop(cards)
  const eq = flopEquity(hand, cards, flop)

  const pot = 5.5
  const bet = +(pot * 0.50).toFixed(1)
  const newPot = +(pot + bet).toFixed(1)
  const raiseTo = +(bet * 3).toFixed(1)
  const feRaise = 0.42

  const evFold = 0
  const evCall = eq * (pot + 2 * bet) - bet
  const evRaise = feRaise * newPot + (1 - feRaise) * (eq * (pot + 2 * raiseTo) - raiseTo)

  const evMap = { fold: evFold, call: evCall, raise: evRaise }
  const freqs = toFreqs(evMap)
  const maxEV = Math.max(evFold, evCall, evRaise)
  const bestId = maxEV === evFold ? 'fold' : maxEV === evCall ? 'call' : 'raise'
  const potOddsNeeded = Math.round(bet / (pot + 2 * bet) * 100)

  return {
    id: makeId(), type: 'face-bet', heroHand: hand, heroCards: cards,
    heroPosition: heroPos, villainPosition: 'BB', stackBB: 100,
    board: flop, pot: newPot, betSize: bet,
    title: 'Face à une mise',
    description: `${heroPos} vs BB. BB bet ${bet}bb dans un pot de ${pot}bb. Votre action ?`,
    options: [
      {
        id: 'fold', label: 'Fold',
        ev: +evFold.toFixed(2), freq: freqs.fold ?? 0,
        explanation: `On abandonne le pot. Correct si notre équité < ${potOddsNeeded}% (pot odds).`,
      },
      {
        id: 'call', label: `Call ${bet}bb`,
        ev: +evCall.toFixed(2), freq: freqs.call ?? 0,
        explanation: `Pot odds ${potOddsNeeded}%. Rentable si équité > ${potOddsNeeded}%. Préféré avec mains moyennes sans equity for raise.`,
      },
      {
        id: 'raise', label: `Raise ${raiseTo}bb`,
        ev: +evRaise.toFixed(2), freq: freqs.raise ?? 0,
        explanation: `Semi-bluff ou value raise. FE ~${Math.round(feRaise * 100)}% sur le flop. Idéal avec flush draw, OESD ou top pair+ .`,
      },
    ],
    bestOptionId: bestId,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

const WEIGHTS: [TrainerScenarioType, number][] = [
  ['rfi', 30],
  ['push-fold', 20],
  ['vs3bet', 20],
  ['cbet', 15],
  ['face-bet', 15],
]

export function generateScenario(
  ranges: Range[],
  typeFilter?: TrainerScenarioType[],
): TrainerScenario {
  const pool = typeFilter && typeFilter.length > 0
    ? WEIGHTS.filter(([t]) => typeFilter.includes(t))
    : WEIGHTS
  if (pool.length === 0) return generateRFI(ranges)

  let rand = Math.random() * pool.reduce((s, [, w]) => s + w, 0)
  let chosen: TrainerScenarioType = pool[0][0]
  for (const [t, w] of pool) { rand -= w; if (rand <= 0) { chosen = t; break } }

  switch (chosen) {
    case 'rfi':       return generateRFI(ranges)
    case 'push-fold': return generatePushFold(ranges)
    case 'vs3bet':    return generateVs3bet(ranges)
    case 'cbet':      return generateCbet(ranges)
    case 'face-bet':  return generateFaceBet(ranges)
  }
}
