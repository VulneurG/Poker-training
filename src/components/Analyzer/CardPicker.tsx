import React from 'react'
import { X } from 'lucide-react'
import { RANKS_ORDERED, SUITS, SUIT_SYMBOL, SUIT_COLOR, RANK_DISPLAY, type Card } from '../../utils/cards'

interface CardPickerProps {
  usedCards: Set<Card>
  onSelect: (card: Card) => void
  onClose: () => void
  title?: string
}

export default function CardPicker({ usedCards, onSelect, onClose, title }: CardPickerProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-2xl p-4 border border-gray-700 max-w-sm w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-sm">{title ?? 'Choisir une carte'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Grid: 4 rows (suits) × 13 cols (ranks) */}
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(13,1fr)' }}>
          {SUITS.map(suit =>
            RANKS_ORDERED.map(rank => {
              const card = `${rank}${suit}` as Card
              const used = usedCards.has(card)
              return (
                <button
                  key={card}
                  disabled={used}
                  onClick={() => { onSelect(card); onClose() }}
                  className={`
                    aspect-[3/4] rounded text-[10px] font-bold flex flex-col items-center justify-center
                    transition-all leading-none
                    ${used
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-700 hover:bg-gray-600 hover:scale-110 cursor-pointer'
                    }
                  `}
                  style={{ color: used ? undefined : SUIT_COLOR[suit] }}
                >
                  <span>{RANK_DISPLAY[rank]}</span>
                  <span className="text-[8px]">{SUIT_SYMBOL[suit]}</span>
                </button>
              )
            })
          )}
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">
          Cartes grisées = déjà utilisées
        </p>
      </div>
    </div>
  )
}
