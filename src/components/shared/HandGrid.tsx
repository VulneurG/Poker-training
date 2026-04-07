import React from 'react'
import { RANKS, getHandNotation, ACTION_COLORS, type HandAction, type HandNotation } from '../../types'

interface HandGridProps {
  hands: Record<HandNotation, { action: HandAction; frequency?: number }>
  onCellClick?: (hand: HandNotation) => void
  onCellHover?: (hand: HandNotation | null) => void
  selectedAction?: HandAction
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
  const cellSize = compact ? 'w-6 h-6 text-[8px]' : 'w-8 h-8 sm:w-9 sm:h-9 text-[9px] sm:text-[10px]'

  return (
    <div className="inline-block select-none">
      <div className="grid" style={{ gridTemplateColumns: `repeat(13, 1fr)`, gap: 1 }}>
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

            // Background: solid for 100%, gradient for mixed
            const bg = action
              ? freq < 100
                ? `linear-gradient(135deg, ${color} ${freq}%, #1f2937 ${freq}%)`
                : color
              : '#1f2937'

            return (
              <div
                key={hand}
                className={`
                  ${cellSize} flex items-center justify-center cursor-pointer
                  transition-transform duration-75 rounded-[2px]
                  ${isHighlighted ? 'ring-2 ring-white scale-110 z-10 relative' : ''}
                  ${!readOnly ? 'hover:scale-105 hover:z-10 hover:relative' : ''}
                  ${isPair ? 'font-bold' : ''}
                `}
                style={{ background: bg }}
                onClick={() => !readOnly && onCellClick?.(hand)}
                onMouseEnter={() => onCellHover?.(hand)}
                onMouseLeave={() => onCellHover?.(null)}
                title={hand}
              >
                <span
                  className={`
                    leading-none font-mono
                    ${action ? 'text-white' : 'text-gray-500'}
                    ${isPair ? 'font-bold' : ''}
                    ${isSuited ? 'italic' : ''}
                  `}
                >
                  {hand.length === 2
                    ? hand
                    : hand.length === 3
                    ? hand.slice(0, 2)
                    : hand.slice(0, 2)}
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* Row/Col labels */}
      <div className="flex mt-1 gap-px" style={{ paddingLeft: compact ? 0 : 0 }}>
        {RANKS.map((r) => (
          <div
            key={r}
            className={`${compact ? 'w-6 text-[7px]' : 'w-8 sm:w-9 text-[8px]'} text-center text-gray-600`}
          >
            {r}
          </div>
        ))}
      </div>
    </div>
  )
}
