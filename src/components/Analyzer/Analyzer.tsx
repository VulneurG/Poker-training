import React, { useState, useCallback, useEffect, useRef } from 'react'
import { RefreshCw, Shuffle, Trash2 } from 'lucide-react'
import PokerTable, { type SeatState } from './PokerTable'
import CardPicker from './CardPicker'
import CardDisplay from './CardDisplay'
import StatsPanel from './StatsPanel'
import { type Card, generateDeck, shuffleDeck } from '../../utils/cards'
import { calculateEquity, type EquityResult } from '../../utils/equity'
import { detectDraws, type DrawInfo } from '../../utils/draws'
import { useStore } from '../../store/useStore'
import { RANKS_ORDERED, SUITS } from '../../utils/cards'
import type { HandNotation } from '../../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSeats(n: number): SeatState[] {
  return Array.from({ length: n }, (_, i) => ({
    seatIdx: i,
    cards: [null, null],
    isHero: i === 0,
    isActive: true,
    label: '',
  }))
}

function getUsedCards(seats: SeatState[], board: (Card | null)[]): Set<Card> {
  const s = new Set<Card>()
  for (const seat of seats)
    for (const c of seat.cards)
      if (c) s.add(c)
  for (const c of board)
    if (c) s.add(c)
  return s
}

// Convert HandNotation + usedCards → actual [Card, Card] combo
function resolveHandCombo(
  notation: HandNotation,
  used: Set<Card>
): [Card, Card] | null {
  const r1 = notation[0] as (typeof RANKS_ORDERED)[number]
  const r2 = notation[1] as (typeof RANKS_ORDERED)[number]
  const isPair   = notation.length === 2
  const isSuited = notation.endsWith('s')

  const combos: [Card, Card][] = []

  if (isPair) {
    for (let i = 0; i < SUITS.length; i++)
      for (let j = i + 1; j < SUITS.length; j++) {
        const c1 = `${r1}${SUITS[i]}` as Card
        const c2 = `${r2}${SUITS[j]}` as Card
        if (!used.has(c1) && !used.has(c2)) combos.push([c1, c2])
      }
  } else if (isSuited) {
    for (const s of SUITS) {
      const c1 = `${r1}${s}` as Card
      const c2 = `${r2}${s}` as Card
      if (!used.has(c1) && !used.has(c2)) combos.push([c1, c2])
    }
  } else {
    for (const s1 of SUITS)
      for (const s2 of SUITS) {
        if (s1 === s2) continue
        const c1 = `${r1}${s1}` as Card
        const c2 = `${r2}${s2}` as Card
        if (!used.has(c1) && !used.has(c2)) combos.push([c1, c2])
      }
  }

  if (combos.length === 0) return null
  return combos[Math.floor(Math.random() * combos.length)]
}

// ─── Main component ───────────────────────────────────────────────────────────

type PickerTarget =
  | { kind: 'seat'; seatIdx: number; cardIdx: 0 | 1 }
  | { kind: 'board'; boardIdx: number }

export default function Analyzer() {
  const { ranges } = useStore()

  const [format, setFormat]       = useState<'6max'|'9max'>('6max')
  const [seats, setSeats]         = useState<SeatState[]>(makeSeats(6))
  const [dealerSeat, setDealerSeat] = useState(3) // BTN default = seat 3 (CO-ish)
  const [board, setBoard]         = useState<(Card|null)[]>([null,null,null,null,null])
  const [picker, setPicker]       = useState<PickerTarget | null>(null)
  const [equity, setEquity]       = useState<EquityResult | null>(null)
  const [drawInfo, setDrawInfo]   = useState<DrawInfo | null>(null)
  const [isCalc, setIsCalc]       = useState(false)
  const [potSize, setPotSize]     = useState(0)
  const [betSize, setBetSize]     = useState(0)
  const [heroStack, setHeroStack] = useState(100)
  const calcTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Change format → rebuild seats
  const changeFormat = (f: '6max'|'9max') => {
    setFormat(f)
    setSeats(makeSeats(f === '6max' ? 6 : 9))
    setBoard([null,null,null,null,null])
    setEquity(null)
    setDrawInfo(null)
  }

  // Card picked from picker
  const handlePickCard = useCallback((card: Card) => {
    if (!picker) return
    if (picker.kind === 'seat') {
      setSeats(prev => prev.map((s, i) =>
        i === picker.seatIdx
          ? { ...s, cards: s.cards.map((c, ci) => ci === picker.cardIdx ? card : c) as [Card|null, Card|null] }
          : s
      ))
    } else {
      setBoard(prev => prev.map((c, i) => i === picker.boardIdx ? card : c))
    }
  }, [picker])

  // Remove a card from board
  const clearBoardCard = (i: number) =>
    setBoard(prev => prev.map((c, ci) => ci === i ? null : c))

  // Remove seat cards
  const clearSeatCards = (seatIdx: number) =>
    setSeats(prev => prev.map((s, i) =>
      i === seatIdx ? { ...s, cards: [null, null] } : s
    ))

  // Toggle seat active/inactive
  const toggleSeat = (idx: number) =>
    setSeats(prev => prev.map((s, i) =>
      i === idx ? { ...s, isActive: !s.isActive, cards: [null, null] } : s
    ))

  // Set hero
  const setHero = (idx: number) =>
    setSeats(prev => prev.map((s, i) => ({ ...s, isHero: i === idx })))

  // Deal random board cards
  const dealBoard = (upTo: 'flop' | 'turn' | 'river') => {
    const used = getUsedCards(seats, board)
    const remaining = shuffleDeck(generateDeck().filter(c => !used.has(c)))
    let ri = 0
    setBoard(prev => {
      const next = [...prev]
      const fill = upTo === 'flop' ? 3 : upTo === 'turn' ? 4 : 5
      for (let i = 0; i < fill; i++) {
        if (!next[i]) next[i] = remaining[ri++]
      }
      return next
    })
  }

  // Deal random hand to a villain from their range (or random)
  const dealRandomToSeat = (seatIdx: number) => {
    const used = getUsedCards(seats, board)
    const seat = seats[seatIdx]

    // Try range first
    if (seat.rangeId) {
      const range = ranges.find(r => r.id === seat.rangeId)
      if (range) {
        const hands = Object.keys(range.hands) as HandNotation[]
        const weighted: HandNotation[] = []
        for (const h of hands) {
          const c = h.length === 2 ? 6 : h.endsWith('s') ? 4 : 12
          for (let i = 0; i < c; i++) weighted.push(h)
        }
        for (let attempt = 0; attempt < 100; attempt++) {
          const hand = weighted[Math.floor(Math.random() * weighted.length)]
          const combo = resolveHandCombo(hand, used)
          if (combo) {
            setSeats(prev => prev.map((s, i) =>
              i === seatIdx ? { ...s, cards: combo } : s
            ))
            return
          }
        }
      }
    }

    // Fall back to random
    const deck = shuffleDeck(generateDeck().filter(c => !used.has(c)))
    setSeats(prev => prev.map((s, i) =>
      i === seatIdx ? { ...s, cards: [deck[0], deck[1]] } : s
    ))
  }

  // Deal random to all villains
  const dealAllRandom = () => {
    let current = [...seats]
    const boardCards = board.filter(Boolean) as Card[]
    const usedSoFar = new Set<Card>(boardCards)

    current = current.map(s => {
      if (!s.isActive || s.isHero) return s
      const deck = shuffleDeck(generateDeck().filter(c => !usedSoFar.has(c)))
      usedSoFar.add(deck[0])
      usedSoFar.add(deck[1])
      return { ...s, cards: [deck[0], deck[1]] as [Card, Card] }
    })
    setSeats(current)
  }

  // Reset everything
  const resetAll = () => {
    setSeats(makeSeats(format === '6max' ? 6 : 9))
    setBoard([null,null,null,null,null])
    setEquity(null)
    setDrawInfo(null)
  }

  // Compute equity + draws whenever relevant state changes
  useEffect(() => {
    if (calcTimer.current) clearTimeout(calcTimer.current)

    const heroSeat  = seats.find(s => s.isHero)
    const heroCards = heroSeat?.cards

    if (!heroCards || !heroCards[0] || !heroCards[1]) {
      setEquity(null)
      setDrawInfo(null)
      return
    }

    const hc: [Card, Card] = [heroCards[0], heroCards[1]]
    const bc = board.filter(Boolean) as Card[]

    // Draws
    if (bc.length >= 3) {
      setDrawInfo(detectDraws(hc, bc))
    } else {
      setDrawInfo(null)
    }

    const activeVillains = seats.filter(s => !s.isHero && s.isActive)
    if (activeVillains.length === 0) { setEquity(null); return }

    setIsCalc(true)
    calcTimer.current = setTimeout(() => {
      const villains = activeVillains.map(s =>
        s.cards[0] && s.cards[1] ? [s.cards[0], s.cards[1]] as [Card,Card] : null
      )
      const result = calculateEquity(hc, villains, bc, 5000)

      // Attach equityPct back to seats
      let vi = 0
      setSeats(prev => prev.map(s => {
        if (!s.isHero && s.isActive) {
          return { ...s, equityPct: result.villainEquities[vi++] * 100 }
        }
        if (s.isHero) return { ...s, equityPct: result.heroEquity * 100 }
        return s
      }))

      setEquity(result)
      setIsCalc(false)
    }, 200)
  }, [seats.map(s => s.cards.join('')).join('|'), board.join(''), seats.map(s=>s.isActive).join('')])

  const usedCards = getUsedCards(seats, board)
  const heroSeat  = seats.find(s => s.isHero)

  return (
    <div className="flex flex-col gap-4 p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-white">Analyseur de situation</h2>
        <div className="flex gap-2 flex-wrap">
          {/* Format selector */}
          {(['6max','9max'] as const).map(f => (
            <button
              key={f}
              onClick={() => changeFormat(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                format === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >{f}</button>
          ))}
          <button
            onClick={dealAllRandom}
            className="flex items-center gap-1.5 bg-purple-700 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Shuffle size={14} /> Distribuer
          </button>
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left: table + board */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Poker table */}
          <div className="bg-gray-900 rounded-2xl p-3 border border-gray-700">
            <PokerTable
              seats={seats}
              format={format}
              dealerSeat={dealerSeat}
              heroSeat={seats.findIndex(s => s.isHero)}
              onCardClick={(seatIdx, cardIdx) => setPicker({ kind:'seat', seatIdx, cardIdx })}
              onSeatToggle={toggleSeat}
              onMoveDealer={setDealerSeat}
              onSetHero={setHero}
            />

            {/* Per-seat quick actions */}
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              {seats.filter(s => s.isActive && !s.isHero).map(s => (
                <button
                  key={s.seatIdx}
                  onClick={() => dealRandomToSeat(s.seatIdx)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Shuffle size={10} /> Siège {s.seatIdx+1}
                </button>
              ))}
            </div>
          </div>

          {/* Board */}
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Board</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => dealBoard('flop')}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded-lg transition-colors"
                >Flop ↩</button>
                <button
                  onClick={() => dealBoard('turn')}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded-lg transition-colors"
                >Turn ↩</button>
                <button
                  onClick={() => dealBoard('river')}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded-lg transition-colors"
                >River ↩</button>
              </div>
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              {/* Flop */}
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="relative group">
                    <CardDisplay
                      card={board[i]}
                      onClick={() => setPicker({ kind:'board', boardIdx:i })}
                      size="md"
                    />
                    {board[i] && (
                      <button
                        onClick={() => clearBoardCard(i)}
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 rounded-full text-white text-[8px] items-center justify-center hidden group-hover:flex"
                      >×</button>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-gray-700 font-bold text-lg mx-1">|</div>

              {/* Turn */}
              <div className="relative group">
                <CardDisplay
                  card={board[3]}
                  onClick={() => setPicker({ kind:'board', boardIdx:3 })}
                  size="md"
                />
                {board[3] && (
                  <button
                    onClick={() => clearBoardCard(3)}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 rounded-full text-white text-[8px] items-center justify-center hidden group-hover:flex"
                  >×</button>
                )}
              </div>

              <div className="text-gray-700 font-bold text-lg mx-1">|</div>

              {/* River */}
              <div className="relative group">
                <CardDisplay
                  card={board[4]}
                  onClick={() => setPicker({ kind:'board', boardIdx:4 })}
                  size="md"
                />
                {board[4] && (
                  <button
                    onClick={() => clearBoardCard(4)}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 rounded-full text-white text-[8px] items-center justify-center hidden group-hover:flex"
                  >×</button>
                )}
              </div>
            </div>

            {/* Range assignment */}
            {ranges.length > 0 && (
              <div className="mt-3 border-t border-gray-800 pt-3">
                <p className="text-xs text-gray-500 mb-2">Assigner une range aux villains (pour distribution aléatoire)</p>
                <div className="flex flex-col gap-1">
                  {seats.filter(s => s.isActive && !s.isHero).map(s => (
                    <div key={s.seatIdx} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-14">Siège {s.seatIdx+1}</span>
                      <select
                        className="bg-gray-800 text-white text-xs rounded-lg px-2 py-1 border border-gray-700 flex-1"
                        value={s.rangeId ?? ''}
                        onChange={e => setSeats(prev => prev.map((seat, i) =>
                          i === s.seatIdx ? { ...seat, rangeId: e.target.value || undefined } : seat
                        ))}
                      >
                        <option value="">Aléatoire (sans range)</option>
                        {ranges.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: stats */}
        <div className="lg:w-72 flex-shrink-0">
          <StatsPanel
            heroCards={
              heroSeat?.cards[0] && heroSeat?.cards[1]
                ? [heroSeat.cards[0], heroSeat.cards[1]]
                : null
            }
            board={board.filter(Boolean) as Card[]}
            equity={equity}
            drawInfo={drawInfo}
            isCalculating={isCalc}
            potSize={potSize}
            betSize={betSize}
            heroStack={heroStack}
            seats={seats}
            onPotChange={setPotSize}
            onBetChange={setBetSize}
            onHeroStackChange={setHeroStack}
          />
        </div>
      </div>

      {/* Card picker modal */}
      {picker && (
        <CardPicker
          usedCards={usedCards}
          onSelect={handlePickCard}
          onClose={() => setPicker(null)}
          title={
            picker.kind === 'seat'
              ? `Carte ${picker.cardIdx + 1} — Siège ${picker.seatIdx + 1}`
              : `Carte board ${picker.boardIdx + 1}`
          }
        />
      )}
    </div>
  )
}
