import React from 'react'
import { LayoutDashboard, BookOpen, Target, Swords } from 'lucide-react'
import { useStore } from './store/useStore'
import Dashboard from './components/Dashboard/Dashboard'
import RangeEditor from './components/RangeEditor/RangeEditor'
import Training from './components/Training/Training'
import Scenarios from './components/Scenarios/Scenarios'
import './index.css'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'ranges', label: 'Ranges', Icon: BookOpen },
  { id: 'training', label: 'Training', Icon: Target },
  { id: 'scenarios', label: 'Scénarios', Icon: Swords },
] as const

export default function App() {
  const { activeView, setActiveView } = useStore()

  return (
    <div className="min-h-svh bg-gray-950 flex flex-col">
      {/* Top bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <span className="text-xl">♠</span>
          <span className="font-bold text-white tracking-tight">PokerTrainer</span>
        </div>
        {/* Desktop nav */}
        <nav className="hidden sm:flex gap-1">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${activeView === id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }
              `}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20 sm:pb-4">
        {activeView === 'dashboard' && <Dashboard />}
        {activeView === 'ranges' && <RangeEditor />}
        {activeView === 'training' && <Training />}
        {activeView === 'scenarios' && <Scenarios />}
      </main>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex z-20">
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveView(id)}
            className={`
              flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors
              ${activeView === id ? 'text-blue-400' : 'text-gray-500'}
            `}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
