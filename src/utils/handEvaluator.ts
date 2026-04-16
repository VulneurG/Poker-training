import { cardValue, cardSuit, type Card } from './cards'

export const CATEGORY_NAMES = [
  'Carte haute', 'Paire', 'Double paire', 'Brelan',
  'Suite', 'Couleur', 'Full house', 'Carré', 'Quinte flush',
]

// Evaluate a 5-card hand → numeric score (higher = better hand)
function evaluate5(hand: Card[]): number {
  const values = hand.map(cardValue).sort((a, b) => b - a)
  const suits  = hand.map(cardSuit)

  const isFlush = suits.every(s => s === suits[0])

  const counts = new Map<number, number>()
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1)

  // Groups sorted: count desc, rank desc
  const groups   = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])
  const gcounts  = groups.map(g => g[1])
  const granks   = groups.map(g => g[0])

  const uniq     = [...new Set(values)].sort((a, b) => b - a)
  const straight = uniq.length === 5 && uniq[0] - uniq[4] === 4
  const wheel    = uniq.length === 5 && uniq[0] === 14 && uniq[1] === 5 && uniq[4] === 2
  const isStraight = straight || wheel
  const straightTop = wheel ? 5 : uniq[0]

  let category: number
  let tie: number[]

  if (isFlush && isStraight)            { category = 8; tie = [straightTop]          }
  else if (gcounts[0] === 4)            { category = 7; tie = granks                 }
  else if (gcounts[0] === 3 && gcounts[1] === 2) { category = 6; tie = granks       }
  else if (isFlush)                     { category = 5; tie = values                 }
  else if (isStraight)                  { category = 4; tie = [straightTop]          }
  else if (gcounts[0] === 3)            { category = 3; tie = granks                 }
  else if (gcounts[0] === 2 && gcounts[1] === 2) { category = 2; tie = granks       }
  else if (gcounts[0] === 2)            { category = 1; tie = granks                 }
  else                                  { category = 0; tie = values                 }

  let score = category * 15 ** 5
  for (let i = 0; i < 5; i++) score += (tie[i] || 0) * 15 ** (4 - i)
  return Math.round(score)
}

// Best 5-card hand from 7 cards (all C(7,5)=21 combos)
export function evaluate7(cards: Card[]): number {
  let best = -1
  for (let i = 0; i < 7; i++)
    for (let j = i + 1; j < 7; j++) {
      const five = cards.filter((_, k) => k !== i && k !== j)
      const s = evaluate5(five)
      if (s > best) best = s
    }
  return best
}

export function getHandCategory(cards: Card[]): number {
  return Math.floor(evaluate7(cards) / 15 ** 5)
}

export function getHandName(cards: Card[]): string {
  return CATEGORY_NAMES[getHandCategory(cards)] ?? '—'
}
