import React from 'react'
import CardDisplay from './CardDisplay'
import { type Card } from '../../utils/cards'

export interface SeatState {
  seatIdx: number
  cards: [Card | null, Card | null]
  isHero: boolean
  isActive: boolean
  rangeId?: string
  label: string // BTN, SB, BB, UTG, HJ, CO...
  stackSize?: number
  equityPct?: number
}

interface PokerTableProps {
  seats: SeatState[]
  format: '6max' | '9max'
  dealerSeat: number
  heroSeat: number
  onCardClick: (seatIdx: number, cardIdx: 0 | 1) => void
  onSeatToggle: (seatIdx: number) => void
  onMoveDealer: (seatIdx: number) => void
  onSetHero: (seatIdx: number) => void
}

// Calculate seat positions on an ellipse
function getSeatPositions(n: number): Array<{ x: number; y: number }> {
  // rx=43%, ry=37% around center (50%, 50%)
  // Start from bottom, go clockwise
  const rx = 43, ry = 37
  return Array.from({ length: n }, (_, i) => {
    const θ = (i * (2 * Math.PI / n)) - Math.PI / 2 // start at top, but we want bottom...
    // Start from bottom (π/2 in screen coords)
    const angle = (i * (2 * Math.PI / n)) + Math.PI / 2
    return {
      x: 50 + rx * Math.cos(angle),
      y: 50 + ry * Math.sin(angle),
    }
  })
}

const POS_LABELS_6: Record<number, string[]> = {
  // [dealer offset]: [BTN, SB, BB, UTG, HJ, CO]
  0: ['BTN','SB','BB','UTG','HJ','CO'],
}

function getPositionLabel(seatIdx: number, totalSeats: number, dealerSeat: number): string {
  const offset = (seatIdx - dealerSeat + totalSeats) % totalSeats
  if (totalSeats === 6) {
    const labels = ['BTN','SB','BB','UTG','HJ','CO']
    return labels[offset] ?? `S${seatIdx+1}`
  } else {
    const labels = ['BTN','SB','BB','UTG','UTG+1','MP','MP+1','HJ','CO']
    return labels[offset] ?? `S${seatIdx+1}`
  }
}

function DealerChip({ className }: { className?: string }) {
  return (
    <div className={`
      w-5 h-5 rounded-full bg-white border-2 border-gray-800
      flex items-center justify-center text-[9px] font-black text-gray-800
      shadow-md ${className ?? ''}
    `}>D</div>
  )
}

function Seat({ seat, isDealer, onCardClick, onSeatToggle, onMoveDealer, onSetHero }: {
  seat: SeatState
  isDealer: boolean
  onCardClick: (cardIdx: 0|1) => void
  onSeatToggle: () => void
  onMoveDealer: () => void
  onSetHero: () => void
}) {
  const borderColor = seat.isHero
    ? 'border-yellow-400'
    : seat.isActive
    ? 'border-blue-500'
    : 'border-gray-600'

  const bgColor = seat.isHero
    ? 'bg-yellow-900/40'
    : seat.isActive
    ? 'bg-gray-800'
    : 'bg-gray-900'

  return (
    <div className="flex flex-col items-center gap-0.5">
      {/* Seat box */}
      <div className={`relative rounded-xl border-2 ${borderColor} ${bgColor} p-1.5 min-w-[64px]`}>
        {/* Dealer chip */}
        {isDealer && (
          <DealerChip className="absolute -top-2 -right-2 z-10" />
        )}

        {/* Position label + hero badge */}
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[9px] font-bold ${seat.isHero ? 'text-yellow-400' : 'text-gray-400'}`}>
            {seat.label}
          </span>
          {seat.isHero && (
            <span className="text-[8px] bg-yellow-500 text-black px-1 rounded-full font-bold leading-none py-0.5">
              HERO
            </span>
          )}
        </div>

        {/* Cards */}
        <div className="flex gap-1 justify-center">
          {([0, 1] as const).map(ci => (
            <CardDisplay
              key={ci}
              card={seat.cards[ci]}
              onClick={() => seat.isActive && onCardClick(ci)}
              size="sm"
              faceDown={!seat.isHero && !seat.cards[ci]}
            />
          ))}
        </div>

        {/* Equity */}
        {seat.equityPct !== undefined && seat.isActive && (
          <div className={`text-center text-[10px] font-bold mt-1 ${
            seat.equityPct >= 50 ? 'text-green-400' : 'text-red-400'
          }`}>
            {Math.round(seat.equityPct)}%
          </div>
        )}

        {/* Stack */}
        {seat.stackSize !== undefined && (
          <div className="text-center text-[9px] text-gray-500 mt-0.5">
            {seat.stackSize}bb
          </div>
        )}
      </div>

      {/* Context actions (tiny buttons) */}
      <div className="flex gap-1">
        {!seat.isHero && (
          <button
            onClick={onSetHero}
            className="text-[8px] text-gray-600 hover:text-yellow-400 transition-colors"
            title="Jouer depuis ce siège"
          >Hero</button>
        )}
        <button
          onClick={onSeatToggle}
          className={`text-[8px] transition-colors ${seat.isActive ? 'text-gray-600 hover:text-red-400' : 'text-gray-600 hover:text-green-400'}`}
          title={seat.isActive ? 'Retirer joueur' : 'Ajouter joueur'}
        >{seat.isActive ? '✕' : '+'}</button>
        <button
          onClick={onMoveDealer}
          className="text-[8px] text-gray-600 hover:text-white transition-colors"
          title="Placer le bouton ici"
        >D</button>
      </div>
    </div>
  )
}

export default function PokerTable({
  seats, format, dealerSeat, heroSeat,
  onCardClick, onSeatToggle, onMoveDealer, onSetHero,
}: PokerTableProps) {
  const n = format === '6max' ? 6 : 9
  const positions = getSeatPositions(n)

  return (
    <div className="relative w-full" style={{ paddingBottom: '60%' }}>
      {/* Table felt */}
      <div
        className="absolute inset-[8%] rounded-[50%] border-4 border-amber-900/60 shadow-2xl"
        style={{ background: 'radial-gradient(ellipse at center, #166534 0%, #14532d 60%, #052e16 100%)' }}
      >
        {/* Center logo */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <span className="text-6xl">♠</span>
        </div>
      </div>

      {/* Seats */}
      {seats.slice(0, n).map((seat, i) => {
        const pos = positions[i]
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Seat
              seat={{ ...seat, label: getPositionLabel(i, n, dealerSeat) }}
              isDealer={i === dealerSeat}
              onCardClick={(ci) => onCardClick(i, ci)}
              onSeatToggle={() => onSeatToggle(i)}
              onMoveDealer={() => onMoveDealer(i)}
              onSetHero={() => onSetHero(i)}
            />
          </div>
        )
      })}
    </div>
  )
}
