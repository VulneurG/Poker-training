import React from 'react'
import { RANKS, getHandNotation, ACTION_COLORS, type HandAction, type HandNotation } from '../../types'

interface HandGridProps {
  hands: Record<HandNotation, { action: HandAction; frequency?: number }>
  onCellClick?: (hand: HandNotation) => void
  onCellHover?: (hand: HandNotation | null) => void
  readOnly?: boolean
  highlightHand?: HandNotation
  compact?: boolean
}

export default function HandGrid({
  hands,
  onCellClick,
  onCellHover,
  readOnly = false,
  highlightHand,
  compact = false,
}: HandGridProps) {
  // Responsive cell sizes: compact=training feedback, normal=editor (with scroll on mobile)
  const cell = compact
    ? 'w-[22px] h-[22px] text-[7px]'
    : 'w-[26px] h-[26px] sm:w-8 sm:h-8 md:w-9 md:h-9 text-[8px] sm:text-[9px] md:text-[10px]'

  const labelW = compact ? 'w-[22px] text-[6px]' : 'w-[26px] sm:w-8 md:w-9 text-[7px] sm:text-[8px]'

  return (
    <div className={`inline-block select-none ${!compact ? 'overflow-x-auto' : ''}`}>
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(13, 1fr)`, gap: 1, minWidth: compact ? 'auto' : 338 }}
      >
        {RANKS.map((_, row) =>
          RANKS.map((_, col) => {
            const hand = getHandNotation(row, col)
            const entry = hands[hand]
            const action = entry?.action
            const freq = entry?.frequency ?? 100
            const color = action ? ACTION_COLORS[action] : 'transparent'
            const isHighlighted = highlightHand === hand
            const isPair = row === col
            const isSuited = row < col

            const bg = action
              ? freq < 100
                ? `linear-gradient(135deg, ${color} ${freq}%, #1f2937 ${freq}%)`
                : color
              : '#1f2937'

            return (
              <div
                key={hand}
                className={`
                  ${cell} flex items-center justify-center rounded-[2px]
                  transition-transform duration-75
                  ${!readOnly ? 'cursor-pointer active:scale-95' : ''}
                  ${isHighlighted ? 'ring-2 ring-white scale-110 z-10 relative' : ''}
                  ${!readOnly ? 'hover:scale-105 hover:z-10 hover:relative' : ''}
                `}
                style={{ background: bg }}
                onClick={() => !readOnly && onCellClick?.(hand)}
                onMouseEnter={() => onCellHover?.(hand)}
                onMouseLeave={() => onCellHover?.(null)}
                title={hand}
              >
                <span
                  className={`
                    leading-none font-mono pointer-events-none
                    ${action ? 'text-white' : 'text-gray-500'}
                    ${isPair ? 'font-bold' : ''}
                    ${isSuited ? 'italic' : ''}
                  `}
                >
                  {hand.slice(0, 2)}
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* Rank labels */}
      <div className="flex mt-0.5 gap-px">
        {RANKS.map((r) => (
          <div key={r} className={`${labelW} text-center text-gray-600`}>{r}</div>
        ))}
      </div>
    </div>
  )
}
