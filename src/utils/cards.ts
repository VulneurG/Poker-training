export const RANKS_ORDERED = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'] as const
export type Rank = typeof RANKS_ORDERED[number]

export const SUITS = ['s','h','d','c'] as const
export type Suit = typeof SUITS[number]

export type Card = `${Rank}${Suit}`

export const RANK_VALUE: Record<Rank, number> = {
  '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,
  '9':9,'T':10,'J':11,'Q':12,'K':13,'A':14,
}

export const SUIT_SYMBOL: Record<Suit, string> = { s:'♠', h:'♥', d:'♦', c:'♣' }
export const SUIT_COLOR: Record<Suit, string>  = { s:'#cbd5e1', h:'#f87171', d:'#f87171', c:'#cbd5e1' }
export const SUIT_BG: Record<Suit, string>     = { s:'bg-slate-200', h:'bg-red-400', d:'bg-red-400', c:'bg-slate-200' }

export const RANK_DISPLAY: Record<Rank, string> = {
  '2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8',
  '9':'9','T':'10','J':'J','Q':'Q','K':'K','A':'A',
}

export function generateDeck(): Card[] {
  const deck: Card[] = []
  for (const rank of RANKS_ORDERED)
    for (const suit of SUITS)
      deck.push(`${rank}${suit}` as Card)
  return deck
}

export function shuffleDeck<T>(arr: T[]): T[] {
  const d = [...arr]
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]]
  }
  return d
}

export function cardRank(c: Card): Rank { return c[0] as Rank }
export function cardSuit(c: Card): Suit { return c[1] as Suit }
export function cardValue(c: Card): number { return RANK_VALUE[cardRank(c)] }
