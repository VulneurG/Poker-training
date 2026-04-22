import React, { useState, useCallback } from 'react'
import { Target, ChevronRight, RotateCcw, TrendingUp, Flame } from 'lucide-react'
import { useStore } from '../../store/useStore'
import CardDisplay from '../Analyzer/CardDisplay'
import FeedbackDisplay from './FeedbackDisplay'
import {
  generateScenario,
  type TrainerScenario,
  type TrainerScenarioType,
} from '../../utils/scenarioEngine'

type Phase = 'idle' | 'question' | 'feedback'

interface SessionStats {
  total: number
  correct: number
  streak: number
  maxStreak: number
}

function emptyStats(): SessionStats {
  return { total: 0, correct: 0, streak: 0, maxStreak: 0 }
}

const ALL_TYPES = ['rfi', 'push-fold', 'vs3bet', 'cbet', 'face-bet'] as const
const TYPE_LABELS: Record<TrainerScenarioType, string> = {
  'rfi': 'Open RFI',
  'push-fold': 'Push/Fold',
  'vs3bet': 'vs 3-bet',
  'cbet': 'C-bet',
  'face-bet': 'Face à bet',
}

export default function ScenarioTrainer() {
  const { ranges } = useStore()
  const [phase, setPhase] = useState<Phase>('idle')
  const [scenario, setScenario] = useState<TrainerScenario | null>(null)
  const [chosenId, setChosenId] = useState<string | null>(null)
  const [stats, setStats] = useState<SessionStats>(emptyStats())
  const [typeFilter, setTypeFilter] = useState<TrainerScenarioType[]>([...ALL_TYPES])

  const next = useCallback(() => {
    const active = typeFilter.length === ALL_TYPES.length ? undefined : typeFilter
    const s = generateScenario(ranges, active)
    setScenario(s)
    setChosenId(null)
    setPhase('question')
  }, [ranges, typeFilter])

  function answer(optionId: string) {
    if (!scenario || phase !== 'question') return
    const isCorrect = optionId === scenario.bestOptionId
    setChosenId(optionId)
    setPhase('feedback')
    setStats(prev => {
      const streak = isCorrect ? prev.streak + 1 : 0
      return {
        total: prev.total + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
        streak,
        maxStreak: Math.max(prev.maxStreak, streak),
      }
    })
  }

  function reset() {
    setPhase('idle')
    setScenario(null)
    setChosenId(null)
    setStats(emptyStats())
  }

  function toggleType(type: TrainerScenarioType) {
    setTypeFilter(prev => {
      if (prev.includes(type)) {
        const next = prev.filter(t => t !== type)
        return next.length === 0 ? [...ALL_TYPES] : next
      }
      return [...prev, type]
    })
  }

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0

  // Height of the fixed action bar (mobile):
  // question: title(20) + n buttons(44 each) + padding(24) ≈ 44+20+44n
  // feedback: 1 button row(48) + padding(24) = 72
  // We use a generous estimate and hide bar on sm+
  const actionBarOffset = 'calc(60px + 170px + env(safe-area-inset-bottom, 0px))'
  const feedbackBarOffset = 'calc(60px + 72px + env(safe-area-inset-bottom, 0px))'

  return (
    <>
      {/* ── Scrollable content ─────────────────────────────────────────── */}
      <div
        className="p-3 sm:p-4 max-w-lg mx-auto space-y-4"
        style={{
          paddingBottom:
            phase === 'question' ? actionBarOffset
            : phase === 'feedback' ? feedbackBarOffset
            : undefined,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Decision Trainer</h2>
            <p className="text-xs text-gray-500">Scénarios dynamiques avec EV estimé</p>
          </div>
          {stats.total > 0 && (
            <div className="flex gap-3">
              <div className="text-center">
                <div className="text-base font-bold text-white">{accuracy}%</div>
                <div className="text-[10px] text-gray-500">précision</div>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-0.5 justify-center">
                  <Flame size={12} className={stats.streak > 0 ? 'text-orange-400' : 'text-gray-600'} />
                  <span className="text-base font-bold text-yellow-400">{stats.streak}</span>
                </div>
                <div className="text-[10px] text-gray-500">streak</div>
              </div>
              <div className="text-center">
                <div className="text-base font-bold text-gray-300">{stats.total}</div>
                <div className="text-[10px] text-gray-500">joués</div>
              </div>
            </div>
          )}
        </div>

        {/* Idle: type filter + start */}
        {phase === 'idle' && (
          <div className="bg-gray-900 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-xs text-gray-400 font-medium mb-2">Types de scénarios</p>
              <div className="flex flex-wrap gap-2">
                {ALL_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors touch-manipulation ${
                      typeFilter.includes(type) ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500'
                    }`}
                  >
                    {TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            {stats.total > 0 && (
              <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-800 pt-3">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={12} />
                  <span>{stats.total} q · {accuracy}% · meilleur streak {stats.maxStreak}</span>
                </div>
                <button onClick={reset} className="hover:text-red-400 transition-colors flex items-center gap-1">
                  <RotateCcw size={11} />
                  Reset
                </button>
              </div>
            )}

            <button
              onClick={next}
              className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 touch-manipulation"
            >
              <Target size={16} />
              {stats.total === 0 ? 'Commencer' : 'Continuer'}
            </button>
          </div>
        )}

        {/* Scenario card */}
        {scenario && phase !== 'idle' && (
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <div className="bg-gray-800/80 px-3 py-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-blue-400">{TYPE_LABELS[scenario.type]}</span>
              <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap justify-end">
                <span className="font-medium text-white">{scenario.heroPosition}</span>
                <span>·</span>
                <span>{scenario.stackBB}bb</span>
                {scenario.villainPosition && (
                  <>
                    <span>·</span>
                    <span>vs {scenario.villainPosition}</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-3 space-y-3">
              <p className="text-sm text-gray-300">{scenario.description}</p>

              <div className="flex items-end gap-5 flex-wrap">
                <div>
                  <div className="text-[10px] text-gray-500 mb-1">Votre main</div>
                  <div className="flex gap-1.5">
                    {scenario.heroCards.map((card, i) => (
                      <CardDisplay key={i} card={card} size="lg" />
                    ))}
                  </div>
                </div>
                {scenario.board.length > 0 && (
                  <div>
                    <div className="text-[10px] text-gray-500 mb-1">Flop</div>
                    <div className="flex gap-1">
                      {scenario.board.map((card, i) => (
                        <CardDisplay key={i} card={card} size="md" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap text-xs">
                {scenario.pot > 0 && (
                  <span className="bg-gray-800 rounded-lg px-2 py-1">
                    Pot <span className="text-white font-bold">{scenario.pot.toFixed(1)}bb</span>
                  </span>
                )}
                {scenario.betSize > 0 && (
                  <span className="bg-gray-800 rounded-lg px-2 py-1">
                    Mise <span className="text-red-400 font-bold">{scenario.betSize.toFixed(1)}bb</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Feedback display */}
        {phase === 'feedback' && scenario && chosenId && (
          <FeedbackDisplay
            options={scenario.options}
            chosenId={chosenId}
            bestId={scenario.bestOptionId}
          />
        )}

        {/* ── Desktop-only action buttons (hidden on mobile) ─────────── */}
        {phase === 'question' && scenario && (
          <div className="hidden sm:block space-y-2">
            <p className="text-xs text-gray-500 text-center font-medium">{scenario.title}</p>
            {scenario.options.map(opt => (
              <button
                key={opt.id}
                onClick={() => answer(opt.id)}
                className="w-full py-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white font-semibold text-sm transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {phase === 'feedback' && scenario && chosenId && (
          <div className="hidden sm:flex gap-2">
            <button
              onClick={next}
              className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2"
            >
              Suivant <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setPhase('idle')}
              className="px-4 py-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        )}
      </div>

      {/* ── Mobile fixed action bar — sits above bottom nav ────────────── */}

      {/* Question phase: answer buttons */}
      {phase === 'question' && scenario && (
        <div
          className="sm:hidden fixed left-0 right-0 bg-gray-950/95 backdrop-blur-sm border-t border-gray-800 px-3 pt-2 pb-2 z-10"
          style={{ bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))' }}
        >
          <p className="text-[10px] text-gray-500 text-center mb-2">{scenario.title}</p>
          <div className="max-w-lg mx-auto space-y-1.5">
            {scenario.options.map(opt => (
              <button
                key={opt.id}
                onClick={() => answer(opt.id)}
                className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white font-semibold text-sm transition-colors touch-manipulation"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feedback phase: next button */}
      {phase === 'feedback' && scenario && chosenId && (
        <div
          className="sm:hidden fixed left-0 right-0 bg-gray-950/95 backdrop-blur-sm border-t border-gray-800 p-3 z-10"
          style={{ bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="max-w-lg mx-auto flex gap-2">
            <button
              onClick={next}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 touch-manipulation"
            >
              Suivant <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setPhase('idle')}
              className="px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 touch-manipulation"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
