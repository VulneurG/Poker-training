import { cardValue, cardSuit, type Card } from './cards'

export interface DrawInfo {
  // Draws
  flushDraw: boolean
  backdoorFlushDraw: boolean
  oesd: boolean
  gutshot: boolean
  backdoorStraight: boolean
  // Outs
  totalOuts: number
  flushOuts: number
  straightOuts: number
  // Probabilities
  turnHitPct: number      // % to hit at least 1 draw on the turn
  riverHitPct: number     // % to hit on river (assuming missed turn)
  turnOrRiverPct: number  // % to hit by the river (rule of 4/2)
  // Board texture
  boardTexture: BoardTexture
  // Human-readable
  descriptions: string[]
}

export interface BoardTexture {
  wetness: 'Sec' | 'Semi-coordonné' | 'Coordonné'
  monotone: boolean
  twoTone: boolean
  rainbow: boolean
  paired: boolean
  triplet: boolean
  highCard: string
  tags: string[]
}

function analyzeBoardTexture(board: Card[]): BoardTexture {
  if (board.length < 3) {
    return { wetness:'Sec', monotone:false, twoTone:false, rainbow:false,
             paired:false, triplet:false, highCard:'—', tags:[] }
  }

  const vals  = board.slice(0,3).map(cardValue).sort((a,b) => b-a)
  const suits = board.slice(0,3).map(cardSuit)

  const suitSet = new Set(suits)
  const monotone = suitSet.size === 1
  const rainbow  = suitSet.size === 3
  const twoTone  = suitSet.size === 2

  const valCounts = new Map<number,number>()
  for (const v of board.map(cardValue)) valCounts.set(v, (valCounts.get(v)||0)+1)
  const maxCount = Math.max(...valCounts.values())
  const paired   = maxCount >= 2
  const triplet  = maxCount >= 3

  // Connectedness of flop (max gap between consecutive sorted values)
  const sorted3 = vals.slice()
  const maxGap = Math.max(sorted3[0]-sorted3[1], sorted3[1]-sorted3[2])
  const connected = maxGap <= 2

  // Wetness score: 0=dry, 1=semi, 2=wet
  let score = 0
  if (monotone || twoTone) score++
  if (monotone) score++
  if (connected) score++
  if (maxGap <= 1) score++

  const wetness = score >= 3 ? 'Coordonné' : score >= 1 ? 'Semi-coordonné' : 'Sec'

  const rankNames: Record<number,string> = {
    14:'A',13:'K',12:'Q',11:'J',10:'T',9:'9',8:'8',7:'7',6:'6',5:'5',4:'4',3:'3',2:'2',
  }
  const highCard = rankNames[vals[0]] ?? '?'

  const tags: string[] = []
  if (monotone)   tags.push('Monotone')
  if (twoTone)    tags.push('Bicolore')
  if (rainbow)    tags.push('Arc-en-ciel')
  if (paired)     tags.push('Pairé')
  if (triplet)    tags.push('Triplé')
  if (connected)  tags.push('Connecté')
  if (vals[0]===14) tags.push('As haut')
  if (score <= 0) tags.push('Board sec')

  return { wetness, monotone, twoTone, rainbow, paired, triplet, highCard, tags }
}

export function detectDraws(heroCards: [Card, Card], board: Card[]): DrawInfo {
  const empty: DrawInfo = {
    flushDraw:false, backdoorFlushDraw:false, oesd:false, gutshot:false, backdoorStraight:false,
    totalOuts:0, flushOuts:0, straightOuts:0,
    turnHitPct:0, riverHitPct:0, turnOrRiverPct:0,
    boardTexture: analyzeBoardTexture(board),
    descriptions:[],
  }
  if (board.length < 3) return empty

  const all    = [...heroCards, ...board]
  const values = all.map(cardValue)
  const suits  = all.map(cardSuit)

  // ── Flush draws ──────────────────────────────────────────────────────────
  const suitCounts: Record<string,number> = {s:0,h:0,d:0,c:0}
  for (const s of suits) suitCounts[s]++
  const maxSuit = Math.max(...Object.values(suitCounts))

  const flushDraw        = maxSuit === 4
  const backdoorFlushDraw = maxSuit === 3 && !flushDraw
  const flushOuts         = flushDraw ? 9 : 0

  // ── Straight draws ───────────────────────────────────────────────────────
  const uniqueVals = new Set(values)
  if (uniqueVals.has(14)) uniqueVals.add(1) // Ace-low
  const valArr = [...uniqueVals].sort((a,b) => a-b)

  const missingRanks = new Set<number>() // ranks needed for straight
  let oesd = false, gutshot = false, backdoorStraight = false

  // Check every 5-card window (1-5 through 10-A)
  for (let lo = 1; lo <= 10; lo++) {
    const window = [lo, lo+1, lo+2, lo+3, lo+4]
    const present = window.filter(v => valArr.includes(v))
    const missing = window.filter(v => !valArr.includes(v))

    if (present.length === 4 && missing.length === 1) {
      missingRanks.add(missing[0] > 13 ? 14 : missing[0]) // normalize ace
      if (missing[0] === lo || missing[0] === lo+4) oesd = true
      else gutshot = true
    }
    if (present.length === 3 && missing.length === 2 && board.length === 3) {
      backdoorStraight = true
    }
  }

  // Count actual outs (4 per rank, minus already on board)
  let straightOuts = 0
  for (const rankVal of missingRanks) {
    const onBoard = values.filter(v => v === rankVal || (rankVal === 14 && v === 1)).length
    straightOuts += Math.max(0, 4 - onBoard)
  }

  const totalOuts = flushOuts + straightOuts

  // ── Probability ──────────────────────────────────────────────────────────
  const seen = all.length
  const remaining = 52 - seen

  let turnHitPct = 0, riverHitPct = 0, turnOrRiverPct = 0

  if (totalOuts > 0) {
    if (board.length === 3) {
      turnHitPct      = Math.round((totalOuts / remaining) * 100)
      riverHitPct     = Math.round((totalOuts / (remaining - 1)) * 100)
      turnOrRiverPct  = Math.min(99, Math.round(totalOuts * 4)) // rule of 4
    } else if (board.length === 4) {
      riverHitPct     = Math.round((totalOuts / remaining) * 100)
      turnOrRiverPct  = Math.min(99, Math.round(totalOuts * 2)) // rule of 2
    }
  }

  // ── Descriptions ─────────────────────────────────────────────────────────
  const descriptions: string[] = []
  if (flushDraw)        descriptions.push(`Flush draw — 9 outs`)
  if (oesd)             descriptions.push(`OESD (bilatéral) — ${straightOuts} outs`)
  else if (gutshot)     descriptions.push(`Gutshot — ${straightOuts} outs`)
  if (backdoorFlushDraw && board.length === 3)
                        descriptions.push('Backdoor flush draw')
  if (backdoorStraight && board.length === 3)
                        descriptions.push('Backdoor straight draw')

  return {
    flushDraw, backdoorFlushDraw, oesd, gutshot, backdoorStraight,
    totalOuts, flushOuts, straightOuts,
    turnHitPct, riverHitPct, turnOrRiverPct,
    boardTexture: analyzeBoardTexture(board),
    descriptions,
  }
}
