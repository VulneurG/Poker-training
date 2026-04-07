import React, { useState, useCallback, useEffect } from 'react'
import { Play, SkipForward, RefreshCw, Trophy, X, Settings2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import {
  POSITIONS, STACK_SIZES, ACTION_COLORS, ACTION_LABELS,
  type Position, type StackSize, type HandAction, type HandNotation,
} from '../../types'
import { randomHandWeighted } from '../../utils/poker'
import HandGrid from '../shared/HandGrid'

type Phase = 'setup' | 'playing' | 'feedback' | 'results'

interface Question {
  hand: HandNotation
  position: Position
  stackSize: StackSize
  correctAction: HandAction
  rangeId: string
}

function generateQuestion(
  ranges: ReturnType<typeof useStore.getState>['ranges'],
  posFilter?: Position[],
  stackFilter?: StackSize[]
): Question | null {
  const filtered = ranges.filter((r) => {
    const posOk = !posFilter?.length || posFilter.includes(r.position)
    const stackOk = !stackFilter?.length || stackFilter.includes(r.stackSize)
    const hasHands = Object.keys(r.hands).length > 0
    return posOk && stackOk && hasHands
  })

  if (filtered.length === 0) return null

  const range = filtered[Math.floor(Math.random() * filtered.length)]
  const hand = randomHandWeighted()

  // Determine correct action from range (default fold if not in range)
  const entry = range.hands[hand]
  const correctAction: HandAction = entry ? entry.action : 'fold'

  return {
    hand,
    position: range.position,
    stackSize: range.stackSize,
    correctAction,
    rangeId: range.id,
  }
}

export default function Training() {
  const { ranges, currentSession, startSession, endSession, recordAttempt, sessions } = useStore()

  const [phase, setPhase] = useState<Phase>('setup')
  const [question, setQuestion] = useState<Question | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [lastAnswer, setLastAnswer] = useState<{ given: HandAction; correct: HandAction } | null>(null)
  const [posFilter, setPosFilter] = useState<Position[]>([])
  const [stackFilter, setStackFilter] = useState<StackSize[]>([])
  const [showConfig, setShowConfig] = useState(false)

  const selectedRange = ranges.find((r) =>
    question ? r.id === question.rangeId : false
  )

  const nextQuestion = useCallback(() => {
    const q = generateQuestion(ranges, posFilter.length ? posFilter : undefined, stackFilter.length ? stackFilter : undefined)
    setQuestion(q)
    setLastAnswer(null)
    setPhase('playing')
  }, [ranges, posFilter, stackFilter])

  const startTraining = () => {
    if (ranges.length === 0) return
    startSession('range', { positions: posFilter, stackSizes: stackFilter })
    setScore({ correct: 0, total: 0 })
    nextQuestion()
  }

  const handleAnswer = (action: HandAction) => {
    if (!question || phase !== 'playing') return

    const isCorrect = action === question.correctAction
    const now = Date.now()

    recordAttempt({
      questionId: `${now}`,
      hand: question.hand,
      position: question.position,
      stackSize: question.stackSize,
      correctAction: question.correctAction,
      givenAction: action,
      isCorrect,
      timestamp: now,
    })

    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }))
    setLastAnswer({ given: action, correct: question.correctAction })
    setPhase('feedback')
  }

  const stopTraining = () => {
    endSession()
    setPhase('results')
  }

  const reset = () => {
    setPhase('setup')
    setQuestion(null)
    setScore({ correct: 0, total: 0 })
  }

  // Compute all-time stats
  const allAttempts = sessions.flatMap((s) => s.attempts)
  const allTime = {
    total: allAttempts.length,
    correct: allAttempts.filter((a) => a.isCorrect).length,
  }

  const ANSWER_ACTIONS: HandAction[] = ['open', 'call', 'fold']

  if (ranges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400 p-4">
        <Trophy size={48} className="opacity-30" />
        <p className="text-center">
          Vous n'avez pas encore de ranges.<br />
          Créez-en une dans l'onglet <b className="text-white">Range Editor</b> avant de vous entraîner.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Training</h2>
        {phase === 'playing' || phase === 'feedback' ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">
              <b className="text-white">{score.correct}</b>/{score.total}
              {score.total > 0 && (
                <span className="ml-1 text-green-400">
                  ({Math.round((score.correct / score.total) * 100)}%)
                </span>
              )}
            </span>
            <button
              onClick={stopTraining}
              className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 transition-colors"
            >
              <X size={14} /> Arrêter
            </button>
          </div>
        ) : null}
      </div>

      {/* Setup */}
      {phase === 'setup' && (
        <div className="bg-gray-800 rounded-2xl p-6 flex flex-col gap-5 border border-gray-700">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
              Configuration
            </h3>

            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-2">
                Positions (laisser vide = toutes)
              </label>
              <div className="flex flex-wrap gap-2">
                {POSITIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() =>
                      setPosFilter((f) =>
                        f.includes(p) ? f.filter((x) => x !== p) : [...f, p]
                      )
                    }
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      posFilter.includes(p)
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'border-gray-600 text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2">
                Stack sizes (laisser vide = tous)
              </label>
              <div className="flex flex-wrap gap-2">
                {STACK_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() =>
                      setStackFilter((f) =>
                        f.includes(s) ? f.filter((x) => x !== s) : [...f, s]
                      )
                    }
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      stackFilter.includes(s)
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'border-gray-600 text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {allTime.total > 0 && (
            <div className="bg-gray-900 rounded-xl p-3 text-sm text-gray-400">
              Stats globales :{' '}
              <b className="text-white">{allTime.correct}/{allTime.total}</b>{' '}
              ({Math.round((allTime.correct / allTime.total) * 100)}% correct)
            </div>
          )}

          <button
            onClick={startTraining}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-semibold text-lg transition-colors"
          >
            <Play size={20} /> Lancer l'entraînement
          </button>
        </div>
      )}

      {/* Playing / Feedback */}
      {(phase === 'playing' || phase === 'feedback') && question && (
        <div className="flex flex-col gap-4">
          {/* Question card */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Votre main</p>
            <div className="text-6xl font-bold font-mono tracking-tight text-white mb-4">
              {question.hand}
            </div>
            <div className="flex justify-center gap-4 text-sm">
              <span className="bg-gray-700 px-3 py-1 rounded-full">
                <b className="text-blue-400">{question.position}</b>
              </span>
              <span className="bg-gray-700 px-3 py-1 rounded-full">
                <b className="text-purple-400">{question.stackSize}</b>
              </span>
            </div>
          </div>

          {/* Feedback overlay */}
          {phase === 'feedback' && lastAnswer && (
            <div
              className={`rounded-2xl p-4 text-center border-2 ${
                lastAnswer.given === lastAnswer.correct
                  ? 'border-green-500 bg-green-900/30'
                  : 'border-red-500 bg-red-900/30'
              }`}
            >
              {lastAnswer.given === lastAnswer.correct ? (
                <p className="text-green-400 font-bold text-lg">✓ Correct !</p>
              ) : (
                <div>
                  <p className="text-red-400 font-bold text-lg mb-1">✗ Incorrect</p>
                  <p className="text-gray-300 text-sm">
                    Tu as répondu{' '}
                    <b style={{ color: ACTION_COLORS[lastAnswer.given] }}>
                      {ACTION_LABELS[lastAnswer.given]}
                    </b>
                    {' '}→ la bonne réponse était{' '}
                    <b style={{ color: ACTION_COLORS[lastAnswer.correct] }}>
                      {ACTION_LABELS[lastAnswer.correct]}
                    </b>
                  </p>
                </div>
              )}

              {/* Show range context */}
              {selectedRange && (
                <div className="mt-3 flex justify-center">
                  <HandGrid
                    hands={selectedRange.hands}
                    readOnly
                    highlightHand={question.hand}
                    compact
                  />
                </div>
              )}
            </div>
          )}

          {/* Answer buttons */}
          {phase === 'playing' ? (
            <div className="grid grid-cols-3 gap-3">
              {ANSWER_ACTIONS.map((action) => (
                <button
                  key={action}
                  onClick={() => handleAnswer(action)}
                  className="py-4 rounded-xl font-bold text-lg text-white transition-all hover:scale-105 active:scale-95"
                  style={{ background: action === 'fold' ? '#374151' : ACTION_COLORS[action] }}
                >
                  {ACTION_LABELS[action]}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={nextQuestion}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              <SkipForward size={18} /> Question suivante
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {phase === 'results' && (
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 text-center flex flex-col gap-4">
          <Trophy size={48} className="mx-auto text-yellow-400" />
          <h3 className="text-2xl font-bold text-white">Session terminée</h3>
          <div className="text-5xl font-bold text-white">
            {Math.round((score.correct / Math.max(score.total, 1)) * 100)}%
          </div>
          <p className="text-gray-400">
            {score.correct} bonnes réponses sur {score.total}
          </p>

          {score.total > 0 && (
            <div className="bg-gray-900 rounded-xl p-3">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${(score.correct / score.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            <RefreshCw size={18} /> Recommencer
          </button>
        </div>
      )}
    </div>
  )
}
