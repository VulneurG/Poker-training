import React, { useState, useCallback } from 'react'
import { Plus, Trash2, Download } from 'lucide-react'
import { useStore, createRange } from '../../store/useStore'
import HandGrid from '../shared/HandGrid'
import { PREBUILT_DEFINITIONS, buildPrebuiltRange } from '../../utils/prebuiltRanges'
import {
  POSITIONS, STACK_SIZES, ACTION_COLORS, ACTION_LABELS,
  type Position, type StackSize, type HandAction, type HandNotation, type Range
} from '../../types'

const ACTIONS: HandAction[] = ['open', 'call', '3bet', 'limp', 'fold']

export default function RangeEditor() {
  const { ranges, addRange, updateRange, deleteRange } = useStore()

  const [selectedRangeId, setSelectedRangeId] = useState<string | null>(
    ranges[0]?.id ?? null
  )
  const [selectedAction, setSelectedAction] = useState<HandAction>('open')
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredHand, setHoveredHand] = useState<HandNotation | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newPos, setNewPos] = useState<Position>('BTN')
  const [newStack, setNewStack] = useState<StackSize>('100bb')
  const [frequency, setFrequency] = useState(100)

  const selectedRange = ranges.find((r) => r.id === selectedRangeId) ?? null

  const loadPrebuiltRanges = () => {
    let firstId: string | null = null
    for (const def of PREBUILT_DEFINITIONS) {
      const exists = ranges.find((r) => r.id === `prebuilt-${def.position}-${def.stackSize}`)
      if (!exists) {
        const range = buildPrebuiltRange(def)
        addRange(range)
        if (!firstId) firstId = range.id
      }
    }
    if (firstId) setSelectedRangeId(firstId)
    else setSelectedRangeId(ranges.find((r) => r.id.startsWith('prebuilt'))?.id ?? null)
  }

  const paintHand = useCallback(
    (hand: HandNotation) => {
      if (!selectedRange) return
      const newHands = { ...selectedRange.hands }
      if (selectedAction === 'fold') {
        delete newHands[hand]
      } else {
        newHands[hand] = { hand, action: selectedAction, frequency }
      }
      updateRange(selectedRange.id, { hands: newHands })
    },
    [selectedRange, selectedAction, frequency, updateRange]
  )

  const handleCellClick = (hand: HandNotation) => paintHand(hand)

  const handleMouseEnter = (hand: HandNotation | null) => {
    setHoveredHand(hand)
    if (isDragging && hand) paintHand(hand)
  }

  const createNewRange = () => {
    const existing = ranges.find(
      (r) => r.position === newPos && r.stackSize === newStack
    )
    if (existing) {
      setSelectedRangeId(existing.id)
      setShowNewForm(false)
      return
    }
    const range = createRange(newPos, newStack)
    addRange(range)
    setSelectedRangeId(range.id)
    setShowNewForm(false)
  }

  const clearRange = () => {
    if (!selectedRange) return
    updateRange(selectedRange.id, { hands: {} })
  }

  const countHands = (range: Range) => Object.keys(range.hands).length

  const combosInRange = (range: Range) => {
    return Object.values(range.hands).reduce((acc, entry) => {
      const h = entry.hand
      const c = h.length === 2 ? 6 : h.endsWith('s') ? 4 : 12
      return acc + c * (entry.frequency ?? 100) / 100
    }, 0)
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-white">Range Editor</h2>
        <div className="flex gap-2">
          <button
            onClick={loadPrebuiltRanges}
            className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            title="Charge 15 ranges débutant 6-Max (UTG→SB × 20bb/40bb/100bb)"
          >
            <Download size={16} /> Ranges débutant 6-Max
          </button>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Nouvelle range
          </button>
        </div>
      </div>

      {/* New range form */}
      {showNewForm && (
        <div className="bg-gray-800 rounded-xl p-4 flex flex-wrap gap-3 items-end border border-gray-700">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Position</label>
            <select
              className="bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm"
              value={newPos}
              onChange={(e) => setNewPos(e.target.value as Position)}
            >
              {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Stack</label>
            <select
              className="bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm"
              value={newStack}
              onChange={(e) => setNewStack(e.target.value as StackSize)}
            >
              {STACK_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button
            onClick={createNewRange}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            Créer
          </button>
          <button
            onClick={() => setShowNewForm(false)}
            className="text-gray-400 hover:text-white px-3 py-1.5 text-sm transition-colors"
          >
            Annuler
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Range list */}
        <div className="lg:w-56 flex-shrink-0">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Mes ranges ({ranges.length})
          </h3>
          <div className="flex flex-col gap-1 max-h-[32rem] overflow-y-auto pr-1">
            {ranges.length === 0 && (
              <p className="text-gray-500 text-sm italic p-2">
                Aucune range. Cliquez "Ranges débutant 6-Max" ou créez-en une.
              </p>
            )}
            {/* Grouper par stack size */}
            {(['100bb','40bb','20bb'] as const).map((stack) => {
              const group = ranges.filter((r) => r.stackSize === stack)
              if (group.length === 0) return null
              const stackColors: Record<string, string> = { '100bb': 'text-green-400', '40bb': 'text-yellow-400', '20bb': 'text-red-400' }
              return (
                <div key={stack} className="mb-2">
                  <div className={`text-xs font-bold px-2 py-0.5 mb-1 ${stackColors[stack] ?? 'text-gray-400'}`}>
                    {stack}{stack === '20bb' ? ' — Push/Fold' : ''}
                  </div>
                  {group.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRangeId(r.id)}
                      className={`
                        w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex justify-between items-center mb-0.5
                        ${selectedRangeId === r.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}
                      `}
                    >
                      <span className="font-medium">{r.position}</span>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Editor area */}
        {selectedRange ? (
          <div className="flex-1 flex flex-col gap-4">
            {/* Range info bar */}
            <div className="bg-gray-800 rounded-xl p-3 flex flex-wrap gap-3 items-center justify-between border border-gray-700">
              <div>
                <span className="text-lg font-bold text-white">{selectedRange.position}</span>
                <span className="text-gray-400 ml-2 text-sm">@ {selectedRange.stackSize}</span>
              </div>
              <div className="flex gap-4 text-sm text-gray-400">
                <span><b className="text-white">{countHands(selectedRange)}</b> mains</span>
                <span><b className="text-white">{Math.round(combosInRange(selectedRange))}</b> combos</span>
                <span>
                  <b className="text-white">
                    {Math.round((combosInRange(selectedRange) / 1326) * 100)}%
                  </b> du jeu
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={clearRange}
                  className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={12} /> Vider
                </button>
                <button
                  onClick={() => deleteRange(selectedRange.id)}
                  className="text-gray-500 hover:text-red-400 text-xs flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={12} /> Supprimer
                </button>
              </div>
            </div>

            {/* Action selector */}
            <div className="flex flex-wrap gap-2 items-center">
              {ACTIONS.map((action) => (
                <button
                  key={action}
                  onClick={() => setSelectedAction(action)}
                  className={`
                    px-3 py-1 rounded-full text-sm font-medium border-2 transition-all
                    ${selectedAction === action ? 'border-white scale-105' : 'border-transparent'}
                  `}
                  style={{
                    background: action === 'fold' ? '#374151' : ACTION_COLORS[action],
                    color: 'white',
                  }}
                >
                  {ACTION_LABELS[action]}
                </button>
              ))}

              {selectedAction !== 'fold' && (
                <div className="flex items-center gap-2 ml-2">
                  <label className="text-xs text-gray-400">Fréquence</label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={10}
                    value={frequency}
                    onChange={(e) => setFrequency(Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-white w-10">{frequency}%</span>
                </div>
              )}
            </div>

            {/* Grid */}
            <div
              className="overflow-x-auto"
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
            >
              <HandGrid
                hands={selectedRange.hands}
                onCellClick={handleCellClick}
                onCellHover={handleMouseEnter}
                highlightHand={hoveredHand ?? undefined}
              />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-xs text-gray-400">
              {ACTIONS.filter((a) => a !== 'fold').map((a) => (
                <span key={a} className="flex items-center gap-1">
                  <span
                    className="w-3 h-3 rounded-sm inline-block"
                    style={{ background: ACTION_COLORS[a] }}
                  />
                  {ACTION_LABELS[a]}
                </span>
              ))}
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm inline-block bg-gray-700" />
                Fold (non colorié)
              </span>
              <span className="text-gray-500 ml-2">Clic ou glisser pour peindre</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Sélectionnez ou créez une range
          </div>
        )}
      </div>
    </div>
  )
}
