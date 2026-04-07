import React, { useState } from 'react'
import { Plus, Trash2, ChevronRight, BookOpen, Calculator, Target } from 'lucide-react'
import { useStore } from '../../store/useStore'
import {
  POSITIONS, STACK_SIZES,
  type Position, type StackSize, type Scenario, type ScenarioOption
} from '../../types'

const SCENARIO_TYPES = [
  { value: 'preflop', label: 'Preflop', icon: '♠' },
  { value: 'push-fold', label: 'Push/Fold', icon: '⬆' },
  { value: 'postflop', label: 'Postflop', icon: '🃏' },
  { value: 'icm', label: 'ICM', icon: '🏆' },
] as const

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// ─── Built-in scenario templates ──────────────────────────────────────────────
const TEMPLATES: Omit<Scenario, 'id' | 'createdAt'>[] = [
  {
    name: 'Open BTN vs BB - Spot classique',
    description: 'Vous êtes au BTN avec 100bb. Le pot est de 1.5bb après votre open à 2.5bb. Le BB 3bet à 10bb. Quelle est votre action avec AJo ?',
    type: 'preflop',
    position: 'BTN',
    stackSize: '100bb',
    heroCards: ['AJo', 'BTN'],
    options: [
      { id: '1', label: 'Fold', action: 'fold', evEstimate: 0, probabilityNote: 'Abandon 2.5bb investis' },
      { id: '2', label: 'Call', action: 'call', evEstimate: 2.1, probabilityNote: 'Bonne cote IP vs SB/BB range' },
      { id: '3', label: '4-Bet', action: '4bet', evEstimate: 3.8, probabilityNote: 'Valeur+bluff, exploite sa range de 3bet' },
    ],
    correctOptionId: '3',
    explanation: 'AJo est dans le haut de votre range de 4-bet pour valeur depuis BTN. Vs un BB qui 3bet large, vous avez la meilleure position et une main qui domine KJ, QJ, AT, A9 dans sa range.',
    tags: ['preflop', '3bet', 'btn', '100bb'],
  },
  {
    name: 'Push/Fold 15bb - UTG',
    description: 'Tournoi. 15bb effective. UTG. Quelle est la décision avec ATo ?',
    type: 'push-fold',
    position: 'UTG',
    stackSize: '15bb',
    options: [
      { id: '1', label: 'Fold', action: 'fold', evEstimate: 0, probabilityNote: 'Trop risqué depuis UTG avec 7 joueurs restants' },
      { id: '2', label: 'Push (All-In)', action: 'open', evEstimate: 1.4, probabilityNote: 'ATo est +EV push depuis UTG à 15bb selon ICM Advisor' },
    ],
    correctOptionId: '2',
    explanation: 'À 15bb, ATo est un push standard depuis UTG selon les charts push/fold GTO. La main a trop de valeur pour fold et trop peu pour open/fold.',
    tags: ['push-fold', 'tournament', 'utg', '15bb'],
  },
  {
    name: 'Squeeze spot - MP vs BTN open + BB call',
    description: 'BTN ouvre à 2.5bb, BB call. Vous êtes en MP avec AQs et 100bb. Squeeze ou fold ?',
    type: 'preflop',
    position: 'MP',
    stackSize: '100bb',
    options: [
      { id: '1', label: 'Fold', action: 'fold', evEstimate: 0, probabilityNote: 'Safe mais perd de la valeur long terme' },
      { id: '2', label: 'Squeeze 3x (9bb)', action: '3bet', evEstimate: 4.2, probabilityNote: 'FE élevé + valeur vs calling ranges' },
      { id: '3', label: 'Squeeze plus grand (12bb)', action: '3bet', evEstimate: 3.5, probabilityNote: 'Plus de fold equity mais lose value vs calls' },
    ],
    correctOptionId: '2',
    explanation: 'AQs est une squeeze idéale : assez fort pour jouer pour valeur, et le cold-caller créée un dead money supplémentaire. Size à 9-10bb est optimal.',
    tags: ['preflop', 'squeeze', '3bet', '100bb'],
  },
]

// ─── Quiz mode ────────────────────────────────────────────────────────────────
function ScenarioQuiz({ scenario, onBack }: { scenario: Scenario; onBack: () => void }) {
  const [selected, setSelected] = useState<string | null>(null)

  const isAnswered = selected !== null
  const isCorrect = selected === scenario.correctOptionId

  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto">
      <button
        onClick={onBack}
        className="text-gray-400 hover:text-white text-sm flex items-center gap-1 self-start transition-colors"
      >
        ← Retour
      </button>

      <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
            {SCENARIO_TYPES.find((t) => t.value === scenario.type)?.label}
          </span>
          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
            {scenario.position} @ {scenario.stackSize}
          </span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{scenario.name}</h3>
        <p className="text-gray-300 text-sm leading-relaxed">{scenario.description}</p>
      </div>

      <div className="flex flex-col gap-2">
        {scenario.options.map((opt) => {
          const isSelected = selected === opt.id
          const isRight = opt.id === scenario.correctOptionId

          let style = 'border-gray-700 bg-gray-800'
          if (isAnswered) {
            if (isRight) style = 'border-green-500 bg-green-900/30'
            else if (isSelected && !isRight) style = 'border-red-500 bg-red-900/30'
          } else if (isSelected) {
            style = 'border-blue-500 bg-blue-900/30'
          }

          return (
            <button
              key={opt.id}
              onClick={() => !isAnswered && setSelected(opt.id)}
              disabled={isAnswered}
              className={`
                text-left p-4 rounded-xl border-2 transition-all
                ${style}
                ${!isAnswered ? 'hover:border-gray-500 cursor-pointer' : 'cursor-default'}
              `}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-white">{opt.label}</span>
                {isAnswered && opt.evEstimate !== undefined && (
                  <span className={`text-xs font-mono ${isRight ? 'text-green-400' : 'text-gray-500'}`}>
                    EV: {opt.evEstimate > 0 ? '+' : ''}{opt.evEstimate}bb
                  </span>
                )}
              </div>
              {isAnswered && opt.probabilityNote && (
                <p className="text-xs text-gray-400 mt-1">{opt.probabilityNote}</p>
              )}
            </button>
          )
        })}
      </div>

      {isAnswered && scenario.explanation && (
        <div className={`rounded-2xl p-4 border-2 ${isCorrect ? 'border-green-500 bg-green-900/20' : 'border-amber-500 bg-amber-900/20'}`}>
          <p className="text-sm font-bold mb-1 text-white">
            {isCorrect ? '✓ Bonne réponse !' : '→ Explication :'}
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">{scenario.explanation}</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Scenarios view ──────────────────────────────────────────────────────
export default function Scenarios() {
  const { scenarios, addScenario, deleteScenario } = useStore()
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null)
  const [showAll, setShowAll] = useState<'custom' | 'templates'>('templates')

  const allScenarios: Scenario[] = [
    ...TEMPLATES.map((t, i) => ({ ...t, id: `template-${i}`, createdAt: 0 })),
    ...scenarios,
  ]

  const displayed = showAll === 'templates'
    ? allScenarios.filter((s) => s.id.startsWith('template'))
    : scenarios

  if (activeScenario) {
    return (
      <div className="p-4">
        <ScenarioQuiz scenario={activeScenario} onBack={() => setActiveScenario(null)} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Scénarios</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['templates', 'custom'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setShowAll(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              showAll === tab ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'templates' ? `Templates (${TEMPLATES.length})` : `Mes scénarios (${scenarios.length})`}
          </button>
        ))}
      </div>

      {/* Scenario list */}
      <div className="grid sm:grid-cols-2 gap-3">
        {displayed.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveScenario(s)}
            className="bg-gray-800 hover:bg-gray-700 rounded-2xl p-4 text-left border border-gray-700 hover:border-gray-500 transition-all group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-full">
                {SCENARIO_TYPES.find((t) => t.value === s.type)?.label}
              </span>
              <ChevronRight size={16} className="text-gray-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-medium text-white text-sm mb-1">{s.name}</h3>
            <p className="text-gray-400 text-xs line-clamp-2">{s.description}</p>
            <div className="flex gap-2 mt-3">
              <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full text-gray-300">
                {s.position}
              </span>
              <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full text-gray-300">
                {s.stackSize}
              </span>
              <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full text-gray-300">
                {s.options.length} options
              </span>
            </div>
          </button>
        ))}
        {displayed.length === 0 && (
          <div className="col-span-2 text-center text-gray-500 py-12">
            {showAll === 'custom'
              ? "Aucun scénario personnalisé pour l'instant."
              : 'Aucun template disponible.'}
          </div>
        )}
      </div>
    </div>
  )
}
