import { generateDeck, shuffleDeck, type Card } from './cards'
import { evaluate7 } from './handEvaluator'

export interface EquityResult {
  heroEquity: number    // 0-1
  heroWinPct: number
  heroTiePct: number
  heroLosePct: number
  villainEquities: number[]  // one per villain
  iterations: number
}

export function calculateEquity(
  heroCards: [Card, Card],
  villains: Array<[Card, Card] | null>,  // null = random hand from remaining deck
  board: Card[],
  iterations = 5000
): EquityResult {
  const known = new Set<Card>([
    ...heroCards,
    ...villains.flatMap(v => v ?? []),
    ...board,
  ])

  const deck = generateDeck().filter(c => !known.has(c))

  let wins = 0, ties = 0
  const vWins = new Array(villains.length).fill(0)

  for (let i = 0; i < iterations; i++) {
    const d = shuffleDeck(deck)
    let idx = 0

    const filled: [Card, Card][] = villains.map(v =>
      v ?? [d[idx++], d[idx++]]
    )

    const b5: Card[] = [...board]
    while (b5.length < 5) b5.push(d[idx++])

    const hScore = evaluate7([...heroCards, ...b5])
    const vScores = filled.map(v => evaluate7([...v, ...b5]))
    const best = Math.max(...vScores)

    if (hScore > best) {
      wins++
    } else if (hScore === best) {
      ties++
    } else {
      vScores.forEach((s, k) => { if (s === best) vWins[k]++ })
    }
  }

  return {
    heroEquity:   (wins + ties * 0.5) / iterations,
    heroWinPct:   wins  / iterations,
    heroTiePct:   ties  / iterations,
    heroLosePct:  (iterations - wins - ties) / iterations,
    villainEquities: vWins.map(w => w / iterations),
    iterations,
  }
}
