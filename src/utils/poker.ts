import { RANKS, type HandNotation, type Rank } from '../types'

// Generate all 169 unique starting hands
export function getAllHands(): HandNotation[] {
  const hands: HandNotation[] = []
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      const r1 = RANKS[r]
      const r2 = RANKS[c]
      if (r === c) hands.push(`${r1}${r2}`)
      else if (r < c) hands.push(`${r1}${r2}s`)
      else hands.push(`${r2}${r1}o`)
    }
  }
  // deduplicate while preserving order
  return [...new Set(hands)]
}

export function rankValue(rank: Rank): number {
  return 14 - RANKS.indexOf(rank)
}

export function isPocketPair(hand: HandNotation): boolean {
  return hand.length === 2 && hand[0] === hand[1]
}

export function isSuited(hand: HandNotation): boolean {
  return hand.endsWith('s')
}

export function isOffsuit(hand: HandNotation): boolean {
  return hand.endsWith('o')
}

// Return a random hand from the 169 canonical hands
export function randomHand(): HandNotation {
  const all = getAllHands()
  return all[Math.floor(Math.random() * all.length)]
}

// Draw a random hand weighted by combos (pairs=6, suited=4, offsuit=12)
export function randomHandWeighted(): HandNotation {
  const all = getAllHands()
  const weighted: HandNotation[] = []
  for (const h of all) {
    const combos = isPocketPair(h) ? 6 : isSuited(h) ? 4 : 12
    for (let i = 0; i < combos; i++) weighted.push(h)
  }
  return weighted[Math.floor(Math.random() * weighted.length)]
}

// Approximate hand strength 0-100 (simple heuristic for display)
export function handStrength(hand: HandNotation): number {
  if (isPocketPair(hand)) {
    const rank = RANKS.indexOf(hand[0] as Rank)
    return Math.round(100 - rank * 6)
  }
  const r1 = RANKS.indexOf(hand[0] as Rank)
  const r2 = RANKS.indexOf(hand[1] as Rank)
  const base = Math.round(100 - (r1 + r2) * 3.5)
  const bonus = isSuited(hand) ? 5 : 0
  return Math.max(1, Math.min(99, base + bonus))
}

// Format display label for a hand (e.g. "A♠K♥")
export const SUIT_SYMBOLS = ['♠', '♥', '♦', '♣']

export function formatHand(hand: HandNotation): string {
  return hand
}

// Simple equity lookup table (approximations for display)
export function approxEquityVsRandom(hand: HandNotation): number {
  return Math.round(handStrength(hand) * 0.45 + 27.5)
}
