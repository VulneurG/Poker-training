import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Range, Scenario, TrainingSession, TrainingAttempt,
  Position, StackSize, HandAction, HandNotation
} from '../types'

interface AppState {
  // ─── Ranges ───────────────────────────────────────────────────────────────
  ranges: Range[]
  addRange: (range: Range) => void
  updateRange: (id: string, updates: Partial<Range>) => void
  deleteRange: (id: string) => void
  getRangeByPositionAndStack: (position: Position, stackSize: StackSize) => Range | undefined

  // ─── Scenarios ────────────────────────────────────────────────────────────
  scenarios: Scenario[]
  addScenario: (scenario: Scenario) => void
  updateScenario: (id: string, updates: Partial<Scenario>) => void
  deleteScenario: (id: string) => void

  // ─── Training ─────────────────────────────────────────────────────────────
  sessions: TrainingSession[]
  currentSession: TrainingSession | null
  startSession: (mode: TrainingSession['mode'], filters: TrainingSession['filters']) => void
  endSession: () => void
  recordAttempt: (attempt: TrainingAttempt) => void

  // ─── UI State ─────────────────────────────────────────────────────────────
  activeView: 'dashboard' | 'ranges' | 'training' | 'scenarios'
  setActiveView: (view: AppState['activeView']) => void
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ─── Ranges ─────────────────────────────────────────────────────────
      ranges: [],

      addRange: (range) => set((s) => ({ ranges: [...s.ranges, range] })),

      updateRange: (id, updates) => set((s) => ({
        ranges: s.ranges.map((r) => r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r),
      })),

      deleteRange: (id) => set((s) => ({ ranges: s.ranges.filter((r) => r.id !== id) })),

      getRangeByPositionAndStack: (position, stackSize) =>
        get().ranges.find((r) => r.position === position && r.stackSize === stackSize),

      // ─── Scenarios ──────────────────────────────────────────────────────
      scenarios: [],

      addScenario: (scenario) => set((s) => ({ scenarios: [...s.scenarios, scenario] })),

      updateScenario: (id, updates) => set((s) => ({
        scenarios: s.scenarios.map((sc) => sc.id === id ? { ...sc, ...updates } : sc),
      })),

      deleteScenario: (id) => set((s) => ({ scenarios: s.scenarios.filter((sc) => sc.id !== id) })),

      // ─── Training ───────────────────────────────────────────────────────
      sessions: [],
      currentSession: null,

      startSession: (mode, filters) => {
        const session: TrainingSession = {
          id: generateId(),
          startedAt: Date.now(),
          attempts: [],
          mode,
          filters,
        }
        set({ currentSession: session })
      },

      endSession: () => {
        const { currentSession } = get()
        if (!currentSession) return
        const ended = { ...currentSession, endedAt: Date.now() }
        set((s) => ({
          sessions: [...s.sessions, ended],
          currentSession: null,
        }))
      },

      recordAttempt: (attempt) => {
        set((s) => ({
          currentSession: s.currentSession
            ? { ...s.currentSession, attempts: [...s.currentSession.attempts, attempt] }
            : null,
        }))
      },

      // ─── UI ─────────────────────────────────────────────────────────────
      activeView: 'dashboard',
      setActiveView: (view) => set({ activeView: view }),
    }),
    {
      name: 'poker-trainer-storage',
      version: 1,
    }
  )
)

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function createRange(
  position: Position,
  stackSize: StackSize,
  name?: string
): Range {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: name ?? `${position} @ ${stackSize}`,
    position,
    stackSize,
    hands: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}
