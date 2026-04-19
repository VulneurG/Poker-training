import React from 'react'
import { LayoutDashboard, BookOpen, Target, Swords, FlaskConical, Lightbulb } from 'lucide-react'
import { useStore } from './store/useStore'
import Dashboard from './components/Dashboard/Dashboard'
import RangeEditor from './components/RangeEditor/RangeEditor'
import Training from './components/Training/Training'
import Scenarios from './components/Scenarios/Scenarios'
import Analyzer from './components/Analyzer/Analyzer'
import ScenarioTrainer from './components/ScenarioTrainer/ScenarioTrainer'
import './index.css'

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard', short: 'Home',    Icon: LayoutDashboard },
  { id: 'ranges',     label: 'Ranges',    short: 'Ranges',  Icon: BookOpen },
  { id: 'training',   label: 'Training',  short: 'Train',   Icon: Target },
  { id: 'trainer',    label: 'Décision',  short: 'Décis',   Icon: Lightbulb },
  { id: 'scenarios',  label: 'Scénarios', short: 'Scénar',  Icon: Swords },
  { id: 'analyzer',   label: 'Analyzer',  short: 'Analyz',  Icon: FlaskConical },
] as const

type View = typeof NAV_ITEMS[number]['id']

export default function App() {
  const { activeView, setActiveView } = useStore()

  return (
    <div className="min-h-svh bg-gray-950 flex flex-col">
      {/* Top bar — hidden on mobile (nav is at bottom) */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-2.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <span className="text-lg">♠</span>
          <span className="font-bold text-white tracking-tight">PokerTrainer</span>
        </div>
        {/* Desktop nav */}
        <nav className="hidden sm:flex gap-1">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveView(id as View)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${activeView === id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }
              `}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* Content — extra padding-bottom on mobile for the fixed nav */}
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(60px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="sm:pb-4">
          {activeView === 'dashboard'  && <Dashboard />}
          {activeView === 'ranges'     && <RangeEditor />}
          {activeView === 'training'   && <Training />}
          {activeView === 'trainer'    && <ScenarioTrainer />}
          {activeView === 'scenarios'  && <Scenarios />}
          {activeView === 'analyzer'   && <Analyzer />}
        </div>
      </main>

      {/* Mobile bottom nav — hidden on sm+ */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 flex z-20"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {NAV_ITEMS.map(({ id, short, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveView(id as View)}
            className={`
              flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors
              min-h-[52px] touch-manipulation
              ${activeView === id ? 'text-blue-400' : 'text-gray-500'}
            `}
          >
            <Icon size={19} />
            <span className="text-[9px] font-medium leading-none">{short}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
