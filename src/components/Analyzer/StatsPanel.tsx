import React from 'react'
import { Zap, Target, BarChart3, Layers, TrendingUp } from 'lucide-react'
import type { EquityResult } from '../../utils/equity'
import type { DrawInfo } from '../../utils/draws'
import type { SeatState } from './PokerTable'
import { getHandName } from '../../utils/handEvaluator'
import type { Card } from '../../utils/cards'

interface StatsPanelProps {
  heroCards: [Card, Card] | null
  board: Card[]
  equity: EquityResult | null
  drawInfo: DrawInfo | null
  isCalculating: boolean
  potSize: number
  betSize: number
  heroStack: number
  seats: SeatState[]
  onPotChange: (v: number) => void
  onBetChange: (v: number) => void
  onHeroStackChange: (v: number) => void
}

function Section({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Icon size={12} /> {title}
      </h3>
      {children}
    </div>
  )
}

function Bar({ value, color = 'bg-blue-500', label }: { value: number; color?: string; label: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-bold">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(100, value * 100)}%` }}
        />
      </div>
    </div>
  )
}

export default function StatsPanel({
  heroCards, board, equity, drawInfo, isCalculating,
  potSize, betSize, heroStack,
  seats, onPotChange, onBetChange, onHeroStackChange,
}: StatsPanelProps) {

  const heroSeat = seats.find(s => s.isHero)
  const activeSeatCount = seats.filter(s => s.isActive).length

  // Current hand name (only if board ≥ 3 cards)
  const handName = heroCards && board.length >= 3
    ? getHandName([...heroCards, ...board])
    : null

  // Pot odds
  const potOdds = betSize > 0 && potSize > 0
    ? betSize / (potSize + 2 * betSize)
    : null

  // SPR
  const effectivePot = potSize > 0 ? potSize : null
  const spr = effectivePot && heroStack > 0
    ? (heroStack / effectivePot).toFixed(1)
    : null

  const sprAdvice = spr ? (
    parseFloat(spr) > 10 ? { color: 'text-blue-400', text: 'Deep — besoin d\'une main premium pour commit' }
    : parseFloat(spr) > 4 ? { color: 'text-yellow-400', text: 'Moyen — deux paires+ suffisent' }
    : { color: 'text-red-400', text: 'Faible — top paire suffit pour commit' }
  ) : null

  const isEnoughForEquity = heroCards !== null && activeSeatCount >= 2

  return (
    <div className="flex flex-col gap-3">
      {/* Hand strength */}
      {handName && (
        <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-xl p-3 border border-purple-700/40">
          <p className="text-xs text-gray-400 mb-1">Main actuelle</p>
          <p className="text-xl font-bold text-white">{handName}</p>
        </div>
      )}

      {/* Equity */}
      <Section title="Équité" icon={BarChart3}>
        {!isEnoughForEquity ? (
          <p className="text-gray-500 text-xs">Donnez une main au Hero et activez au moins 1 adversaire.</p>
        ) : isCalculating ? (
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Calcul en cours…
          </div>
        ) : equity ? (
          <div className="flex flex-col gap-2">
            <Bar value={equity.heroEquity} color="bg-green-500" label="Hero (équité totale)" />
            <div className="grid grid-cols-3 gap-2 text-center text-xs mt-1">
              <div className="bg-gray-700 rounded-lg p-1.5">
                <div className="text-green-400 font-bold">{Math.round(equity.heroWinPct*100)}%</div>
                <div className="text-gray-500">Victoire</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-1.5">
                <div className="text-yellow-400 font-bold">{Math.round(equity.heroTiePct*100)}%</div>
                <div className="text-gray-500">Égalité</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-1.5">
                <div className="text-red-400 font-bold">{Math.round(equity.heroLosePct*100)}%</div>
                <div className="text-gray-500">Défaite</div>
              </div>
            </div>
            <p className="text-[10px] text-gray-600 text-right">{equity.iterations.toLocaleString()} itérations</p>
          </div>
        ) : null}
      </Section>

      {/* Draws & Outs */}
      {drawInfo && board.length >= 3 && (
        <Section title="Draws & Outs" icon={Zap}>
          {drawInfo.descriptions.length === 0 && drawInfo.totalOuts === 0 ? (
            <p className="text-gray-500 text-xs">Aucun draw détecté.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {drawInfo.descriptions.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                  <span className="text-xs text-gray-300">{d}</span>
                </div>
              ))}

              {drawInfo.totalOuts > 0 && (
                <div className="bg-gray-900 rounded-lg p-2 mt-1">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-400">Total outs</span>
                    <span className="font-bold text-orange-400">{drawInfo.totalOuts}</span>
                  </div>
                  {board.length === 3 && (
                    <>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Hit à la Turn</span>
                        <span className="font-bold text-white">{drawInfo.turnHitPct}%</span>
                      </div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Hit à la River (si miss)</span>
                        <span className="font-bold text-white">{drawInfo.riverHitPct}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400 font-semibold">Turn ou River</span>
                        <span className="font-bold text-orange-400">{drawInfo.turnOrRiverPct}%</span>
                      </div>
                    </>
                  )}
                  {board.length === 4 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400 font-semibold">Hit à la River</span>
                      <span className="font-bold text-orange-400">{drawInfo.riverHitPct}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      {/* Board texture */}
      {board.length >= 3 && drawInfo && (
        <Section title="Texture du board" icon={Layers}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Humidité</span>
              <span className={`text-xs font-bold ${
                drawInfo.boardTexture.wetness === 'Coordonné'      ? 'text-red-400'
                : drawInfo.boardTexture.wetness === 'Semi-coordonné' ? 'text-yellow-400'
                : 'text-green-400'
              }`}>{drawInfo.boardTexture.wetness}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {drawInfo.boardTexture.tags.map((tag, i) => (
                <span key={i} className="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Pot Odds & SPR */}
      <Section title="Pot odds & SPR" icon={Target}>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Pot (bb)</label>
            <input
              type="number" min={0} value={potSize || ''}
              onChange={e => onPotChange(Number(e.target.value))}
              className="w-full bg-gray-700 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Mise (bb)</label>
            <input
              type="number" min={0} value={betSize || ''}
              onChange={e => onBetChange(Number(e.target.value))}
              className="w-full bg-gray-700 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="0"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">Stack Hero (bb)</label>
          <input
            type="number" min={0} value={heroStack || ''}
            onChange={e => onHeroStackChange(Number(e.target.value))}
            className="w-full bg-gray-700 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-600 focus:border-blue-500 focus:outline-none mb-2"
            placeholder="100"
          />
        </div>

        {potOdds !== null && (
          <div className="bg-gray-900 rounded-lg p-2 text-xs">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Cote du pot</span>
              <span className="font-bold text-white">{Math.round(potOdds * 100)}%</span>
            </div>
            {equity && (
              <div className={`flex justify-between font-semibold ${
                equity.heroEquity >= potOdds ? 'text-green-400' : 'text-red-400'
              }`}>
                <span>{equity.heroEquity >= potOdds ? '✓ Call profitable' : '✗ Call non rentable'}</span>
                <span>
                  Equity: {Math.round(equity.heroEquity*100)}% vs Cote: {Math.round(potOdds*100)}%
                </span>
              </div>
            )}
          </div>
        )}

        {spr && (
          <div className="bg-gray-900 rounded-lg p-2 text-xs mt-2">
            <div className="flex justify-between">
              <span className="text-gray-400">SPR</span>
              <span className={`font-bold ${sprAdvice?.color}`}>{spr}</span>
            </div>
            {sprAdvice && (
              <p className={`text-[10px] mt-1 ${sprAdvice.color}`}>{sprAdvice.text}</p>
            )}
          </div>
        )}
      </Section>
    </div>
  )
}
