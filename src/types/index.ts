// ─── Positions ───────────────────────────────────────────────────────────────
export type Position = 'UTG' | 'UTG+1' | 'MP' | 'MP+1' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB'

export const POSITIONS: Position[] = ['UTG', 'UTG+1', 'MP', 'MP+1', 'HJ', 'CO', 'BTN', 'SB', 'BB']

export const POSITION_LABELS: Record<Position, string> = {
  'UTG': 'Under the Gun',
  'UTG+1': 'UTG+1',
  'MP': 'Middle Position',
  'MP+1': 'MP+1',
  'HJ': 'Hijack',
  'CO': 'Cut Off',
  'BTN': 'Button',
  'SB': 'Small Blind',
  'BB': 'Big Blind',
}

// ─── Stack Sizes ─────────────────────────────────────────────────────────────
export type StackSize = '10bb' | '15bb' | '20bb' | '25bb' | '30bb' | '40bb' | '50bb' | '75bb' | '100bb' | '150bb' | '200bb+'

export const STACK_SIZES: StackSize[] = ['10bb', '15bb', '20bb', '25bb', '30bb', '40bb', '50bb', '75bb', '100bb', '150bb', '200bb+']

// ─── Hand Actions ─────────────────────────────────────────────────────────────
export type HandAction = 'open' | 'call' | 'fold' | '3bet' | 'limp'

export const ACTION_COLORS: Record<HandAction, string> = {
  open: '#22c55e',   // green
  call: '#3b82f6',   // blue
  '3bet': '#f59e0b', // amber
  limp: '#8b5cf6',   // purple
  fold: 'transparent',
}

export const ACTION_LABELS: Record<HandAction, string> = {
  open: 'Open',
  call: 'Call',
  '3bet': '3-Bet',
  limp: 'Limp',
  fold: 'Fold',
}

// ─── Hand Notation ────────────────────────────────────────────────────────────
// Hands represented in standard notation: 'AA', 'AKs', 'AKo', etc.
export type HandNotation = string

export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const
export type Rank = typeof RANKS[number]

// Returns the hand notation for grid cell (row, col) where row=0 is A-row
export function getHandNotation(row: number, col: number): HandNotation {
  const r1 = RANKS[row]
  const r2 = RANKS[col]
  if (row === col) return `${r1}${r2}` // pocket pair
  if (row < col) return `${r1}${r2}s`  // suited (row=higher rank)
  return `${r2}${r1}o`                  // offsuit (col=higher rank)
}

// ─── Range ───────────────────────────────────────────────────────────────────
export interface RangeEntry {
  hand: HandNotation
  action: HandAction
  frequency?: number // 0–100, for mixed strategies
}

export interface Range {
  id: string
  name: string
  position: Position
  stackSize: StackSize
  hands: Record<HandNotation, RangeEntry>
  createdAt: number
  updatedAt: number
}

// ─── Scenario ─────────────────────────────────────────────────────────────────
export type ScenarioType = 'preflop' | 'postflop' | 'push-fold' | 'icm'

export interface ScenarioOption {
  id: string
  label: string
  action: HandAction | string
  evEstimate?: number
  probabilityNote?: string
}

export interface Scenario {
  id: string
  name: string
  description: string
  type: ScenarioType
  position: Position
  stackSize: StackSize
  heroCards?: [HandNotation, string] // hand + position
  boardCards?: string[]
  villainPosition?: Position
  pot?: number
  betSize?: number
  options: ScenarioOption[]
  correctOptionId?: string
  explanation?: string
  tags: string[]
  createdAt: number
}

// ─── Training Session ─────────────────────────────────────────────────────────
export interface TrainingQuestion {
  id: string
  hand: HandNotation
  position: Position
  stackSize: StackSize
  rangeId: string
  correctAction: HandAction
  scenarioId?: string
}

export interface TrainingAttempt {
  questionId: string
  hand: HandNotation
  position: Position
  stackSize: StackSize
  correctAction: HandAction
  givenAction: HandAction
  isCorrect: boolean
  timestamp: number
}

export interface TrainingSession {
  id: string
  startedAt: number
  endedAt?: number
  attempts: TrainingAttempt[]
  mode: 'range' | 'scenario'
  filters: {
    positions?: Position[]
    stackSizes?: StackSize[]
    rangeIds?: string[]
  }
}

// ─── Stats ───────────────────────────────────────────────────────────────────
export interface HandStats {
  hand: HandNotation
  attempts: number
  correct: number
}

export interface PositionStats {
  position: Position
  attempts: number
  correct: number
}
