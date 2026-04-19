import React from 'react'
import CardDisplay from './CardDisplay'
import { type Card } from '../../utils/cards'

export interface SeatState {
  seatIdx: number
  cards: [Card | null, Card | null]
  isHero: boolean
  isActive: boolean
  rangeId?: string
  label: string
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

function getSeatPositions(n: number) {
  const rx = 43, ry = 37
  return Array.from({ length: n }, (_, i) => {
    const angle = (i * (2 * Math.PI / n)) + Math.PI / 2
    return { x: 50 + rx * Math.cos(angle), y: 50 + ry * Math.sin(angle) }
  })
}

function getPositionLabel(seatIdx: number, total: number, dealerSeat: number): string {
  const offset = (seatIdx - dealerSeat + total) % total
  const labels6 = ['BTN','SB','BB','UTG','HJ','CO']
  const labels9 = ['BTN','SB','BB','UTG','UTG+1','MP','MP+1','HJ','CO']
  return (total === 6 ? labels6 : labels9)[offset] ?? `S${seatIdx+1}`
}

function DealerChip() {
  return (
    <div className="absolute -top-2 -right-2 z-10 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white border-2 border-gray-800 flex items-center justify-center text-[7px] sm:text-[9px] font-black text-gray-800 shadow-md">
      D
    </div>
  )
}

function Seat({ seat, isDealer, onCardClick, onSeatToggle, onMoveDealer, onSetHero }: {
  seat: SeatState
  isDealer: boolean
  onCardClick: (ci: 0|1) => void
  onSeatToggle: () => void
  onMoveDealer: () => void
  onSetHero: () => void
}) {
  const border = seat.isHero ? 'border-yellow-400' : seat.isActive ? 'border-blue-500' : 'border-gray-600'
  const bg = seat.isHero ? 'bg-yellow-900/40' : seat.isActive ? 'bg-gray-800' : 'bg-gray-900/80'

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={`relative rounded-lg border-2 ${border} ${bg} p-1 min-w-[52px] sm:min-w-[64px]`}>
        {isDealer && <DealerChip />}

        {/* Label row */}
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className={`text-[8px] sm:text-[9px] font-bold leading-none ${seat.isHero ? 'text-yellow-400' : 'text-gray-400'}`}>
            {seat.label}
          </span>
          {seat.isHero && (
            <span className="text-[7px] bg-yellow-500 text-black px-0.5 rounded font-bold leading-none">
              HERO
            </span>
          )}
        </div>

        {/* Cards */}
        <div className="flex gap-0.5 sm:gap-1 justify-center">
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
          <div className={`text-center text-[9px] font-bold mt-0.5 ${seat.equityPct >= 50 ? 'text-green-400' : 'text-red-400'}`}>
            {Math.round(seat.equityPct)}%
          </div>
        )}
      </div>

      {/* Quick actions — tap-friendly */}
      <div className="flex gap-1">
        {!seat.isHero && (
          <button
            onClick={onSetHero}
            className="text-[8px] text-gray-600 hover:text-yellow-400 active:text-yellow-300 transition-colors p-0.5"
          >★</button>
        )}
        <button
          onClick={onSeatToggle}
          className={`text-[8px] p-0.5 transition-colors ${seat.isActive ? 'text-gray-600 hover:text-red-400' : 'text-gray-600 hover:text-green-400'}`}
        >{seat.isActive ? '✕' : '+'}</button>
        <button
          onClick={onMoveDealer}
          className="text-[8px] text-gray-600 hover:text-white p-0.5 transition-colors"
        >D</button>
      </div>
    </div>
  )
}

export default function PokerTable({ seats, format, dealerSeat, onCardClick, onSeatToggle, onMoveDealer, onSetHero }: PokerTableProps) {
  const n = format === '6max' ? 6 : 9
  const positions = getSeatPositions(n)

  return (
    // Wrapper with minimum width to avoid overlap on tiny screens
    <div className="overflow-x-auto">
      <div className="relative w-full min-w-[320px]" style={{ paddingBottom: '62%' }}>
        {/* Table felt */}
        <div
          className="absolute inset-[7%] rounded-[50%] border-4 border-amber-900/50 shadow-2xl"
          style={{ background: 'radial-gradient(ellipse at center, #166534 0%, #14532d 65%, #052e16 100%)' }}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <span className="text-5xl sm:text-6xl">♠</span>
          </div>
        </div>

        {/* Seats */}
        {seats.slice(0, n).map((seat, i) => {
          const pos = positions[i]
          return (
            <div
              key={i}
              className="absolute"
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
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
    </div>
  )
}
