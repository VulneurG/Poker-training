import React from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import type { EVOption } from '../../utils/scenarioEngine'

interface FeedbackDisplayProps {
  options: EVOption[]
  chosenId: string
  bestId: string
}

export default function FeedbackDisplay({ options, chosenId, bestId }: FeedbackDisplayProps) {
  const isCorrect = chosenId === bestId
  const maxEV = Math.max(...options.map(o => o.ev))
  const minEV = Math.min(...options.map(o => o.ev))
  const evRange = maxEV - minEV || 1

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      {/* Result banner — solid background for visibility */}
      <div className={`flex items-center gap-2 px-3 py-3 ${isCorrect ? 'bg-green-700' : 'bg-red-700'}`}>
        {isCorrect
          ? <CheckCircle size={16} className="text-white shrink-0" />
          : <XCircle size={16} className="text-white shrink-0" />
        }
        <span className="text-sm font-semibold text-white">
          {isCorrect
            ? 'Correct !'
            : `Incorrect — meilleure action : ${options.find(o => o.id === bestId)?.label ?? bestId}`
          }
        </span>
      </div>

      {/* Options */}
      <div className="p-3 space-y-2">
        {options.map(opt => {
          const isChosen = opt.id === chosenId
          const isBest = opt.id === bestId
          const barPct = Math.max(6, ((opt.ev - minEV) / evRange) * 100)

          const borderCls = isBest
            ? 'border-green-600'
            : (isChosen ? 'border-red-600' : 'border-gray-700')
          const barCls = isBest ? 'bg-green-500' : isChosen ? 'bg-red-500' : 'bg-gray-600'
          // Color EV by context: green=best, red=wrong-chosen, gray=neutral
          const evColorCls = isBest ? 'text-green-400' : isChosen ? 'text-red-400' : 'text-gray-400'

          return (
            <div key={opt.id} className={`rounded-lg border ${borderCls} p-2 space-y-1.5`}>
              {/* Header row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {isBest && isChosen && (
                    <span className="text-[9px] bg-green-600 text-white px-1 rounded font-bold shrink-0">✓ OPTIMAL</span>
                  )}
                  {isBest && !isChosen && (
                    <span className="text-[9px] bg-green-700 text-white px-1 rounded font-bold shrink-0">OPTIMAL</span>
                  )}
                  {!isBest && isChosen && (
                    <span className="text-[9px] bg-red-700 text-white px-1 rounded font-bold shrink-0">VOTRE CHOIX</span>
                  )}
                  <span className="text-sm font-semibold text-white truncate">{opt.label}</span>
                </div>
                <span className={`text-sm font-bold shrink-0 ${evColorCls}`}>
                  {opt.ev >= 0 ? '+' : ''}{opt.ev.toFixed(2)}bb
                </span>
              </div>

              {/* EV bar */}
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${barCls}`} style={{ width: `${barPct}%` }} />
              </div>

              {/* GTO freq + explanation on one line */}
              <p className="text-[10px] text-gray-400 leading-relaxed">
                <span className="text-blue-400 font-semibold">GTO {opt.freq}%</span>
                {' — '}{opt.explanation}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
