import React from 'react'
import { SUIT_SYMBOL, SUIT_COLOR, RANK_DISPLAY, cardRank, cardSuit, type Card } from '../../utils/cards'

interface CardDisplayProps {
  card: Card | null
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
  faceDown?: boolean
  highlight?: boolean
}

const SIZE_CLASSES = {
  sm: 'w-6 h-8 sm:w-7 sm:h-10 text-[9px] sm:text-xs',
  md: 'w-8 h-11 sm:w-9 sm:h-12 text-xs sm:text-sm',
  lg: 'w-11 h-15 sm:w-12 sm:h-16 text-sm sm:text-base',
}

export default function CardDisplay({ card, onClick, size = 'md', faceDown = false, highlight = false }: CardDisplayProps) {
  const base = `
    rounded-md border select-none flex flex-col items-center justify-center font-bold leading-none
    transition-all cursor-pointer
    ${highlight ? 'ring-2 ring-yellow-400' : ''}
  `

  if (!card) {
    return (
      <div
        onClick={onClick}
        className={`${base} ${SIZE_CLASSES[size]} bg-gray-700 border-gray-600 hover:border-gray-400 hover:bg-gray-600`}
      >
        <span className="text-gray-500 text-xs">?</span>
      </div>
    )
  }

  if (faceDown) {
    return (
      <div
        onClick={onClick}
        className={`${base} ${SIZE_CLASSES[size]} bg-blue-900 border-blue-700 hover:border-blue-500`}
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #1e3a5f 0px, #1e3a5f 2px, #1e40af 2px, #1e40af 4px)' }}
      />
    )
  }

  const rank = cardRank(card)
  const suit = cardSuit(card)

  return (
    <div
      onClick={onClick}
      className={`${base} ${SIZE_CLASSES[size]} bg-white border-gray-300 hover:border-yellow-400`}
    >
      <span className="text-[11px] font-black leading-none" style={{ color: SUIT_COLOR[suit] }}>
        {RANK_DISPLAY[rank]}
      </span>
      <span className="text-[9px] leading-none" style={{ color: SUIT_COLOR[suit] }}>
        {SUIT_SYMBOL[suit]}
      </span>
    </div>
  )
}
