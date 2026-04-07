import React from 'react'
import { Target, TrendingUp, BookOpen, Zap, BarChart3 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import type { Position, HandNotation } from '../../types'
import { POSITIONS } from '../../types'

function StatCard({ label, value, sub, color = 'text-white' }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const { ranges, scenarios, sessions, setActiveView } = useStore()

  const allAttempts = sessions.flatMap((s) => s.attempts)
  const total = allAttempts.length
  const correct = allAttempts.filter((a) => a.isCorrect).length
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0

  // Per-position stats
  const posStats = POSITIONS.map((pos) => {
    const att = allAttempts.filter((a) => a.position === pos)
    const c = att.filter((a) => a.isCorrect).length
    return { pos, total: att.length, correct: c, pct: att.length > 0 ? Math.round((c / att.length) * 100) : null }
  }).filter((p) => p.total > 0)

  // Hardest hands
  const handMap: Record<HandNotation, { correct: number; total: number }> = {}
  for (const a of allAttempts) {
    if (!handMap[a.hand]) handMap[a.hand] = { correct: 0, total: 0 }
    handMap[a.hand].total++
    if (a.isCorrect) handMap[a.hand].correct++
  }
  const hardestHands = Object.entries(handMap)
    .filter(([, v]) => v.total >= 3)
    .sort(([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total))
    .slice(0, 6)

  // Recent sessions
  const recentSessions = [...sessions].reverse().slice(0, 5)

  const hasData = total > 0

  return (
    <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto">
      {/* Welcome banner when no data */}
      {!hasData && (
        <div className="bg-gradient-to-br from-green-900/40 to-blue-900/40 rounded-2xl p-6 border border-green-800/40 text-center">
          <div className="text-4xl mb-3">♠️♥️♦️♣️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Bienvenue sur PokerTrainer</h2>
          <p className="text-gray-400 mb-4">
            Commencez par créer vos ranges puis lancez une session d'entraînement.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setActiveView('ranges')}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors"
            >
              Créer mes ranges
            </button>
            <button
              onClick={() => setActiveView('training')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors"
            >
              S'entraîner
            </button>
          </div>
        </div>
      )}

      {/* Stats overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Ranges créées" value={ranges.length} sub="positions × stacks" />
        <StatCard label="Sessions" value={sessions.length} sub="terminées" />
        <StatCard
          label="Précision globale"
          value={hasData ? `${pct}%` : '—'}
          sub={hasData ? `${correct}/${total} correctes` : 'Aucune donnée'}
          color={pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-yellow-400' : hasData ? 'text-red-400' : 'text-white'}
        />
        <StatCard label="Scénarios" value={scenarios.length} sub="personnalisés" />
      </div>

      {/* Progress bar */}
      {hasData && (
        <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400 flex items-center gap-2">
              <TrendingUp size={14} /> Précision globale
            </span>
            <span className="text-sm font-bold text-white">{pct}%</span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>0%</span>
            <span>Objectif : 85%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Per-position stats */}
        {posStats.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Target size={14} /> Par position
            </h3>
            <div className="flex flex-col gap-2">
              {posStats.map(({ pos, total, correct, pct }) => (
                <div key={pos}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-300 font-medium">{pos}</span>
                    <span className="text-gray-400">{correct}/{total} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        (pct ?? 0) >= 80 ? 'bg-green-500' : (pct ?? 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${pct ?? 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hardest hands */}
        {hardestHands.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap size={14} /> Mains les plus difficiles
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {hardestHands.map(([hand, stats]) => (
                <div key={hand} className="bg-gray-900 rounded-xl p-2 text-center">
                  <div className="font-bold font-mono text-white text-lg">{hand}</div>
                  <div className={`text-xs ${
                    (stats.correct / stats.total) >= 0.7 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {Math.round((stats.correct / stats.total) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <BarChart3 size={14} /> Sessions récentes
          </h3>
          <div className="flex flex-col gap-2">
            {recentSessions.map((s) => {
              const att = s.attempts
              const c = att.filter((a) => a.isCorrect).length
              const pct = att.length > 0 ? Math.round((c / att.length) * 100) : 0
              const date = new Date(s.startedAt).toLocaleDateString('fr-FR', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
              })
              return (
                <div key={s.id} className="flex items-center justify-between bg-gray-900 rounded-xl px-3 py-2">
                  <span className="text-xs text-gray-400">{date}</span>
                  <span className="text-xs text-gray-400">{att.length} mains</span>
                  <span className={`text-sm font-bold ${
                    pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {pct}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
