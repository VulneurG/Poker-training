/**
 * Ranges débutant 6-Max
 * Sources : GTO Wizard simplifié, PokerStrategy, upswingpoker charts
 *
 * Couverture :
 *   Positions : UTG, HJ, CO, BTN, SB
 *   Stack sizes : 20bb (push/fold), 40bb (short stack), 100bb (deep stack)
 *   Action principale : open (RFI = Raise First In)
 */

import type { Position, StackSize, HandAction, HandNotation, Range } from '../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeHands(
  openList: HandNotation[],
  extraActions?: { hands: HandNotation[]; action: HandAction }[]
): Range['hands'] {
  const result: Range['hands'] = {}
  for (const h of openList) {
    result[h] = { hand: h, action: 'open', frequency: 100 }
  }
  if (extraActions) {
    for (const { hands, action } of extraActions) {
      for (const h of hands) {
        result[h] = { hand: h, action, frequency: 100 }
      }
    }
  }
  return result
}

// ─── 100bb Ranges ────────────────────────────────────────────────────────────

// UTG 100bb — ~15% du jeu (18 combos paires, suited connectors forts, AX)
const UTG_100_OPEN: HandNotation[] = [
  // Paires
  'AA','KK','QQ','JJ','TT','99','88','77',
  // Suited Aces
  'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A5s','A4s',
  // Suited Kings
  'KQs','KJs','KTs','K9s',
  // Suited Queens/Jacks
  'QJs','QTs','Q9s','JTs','J9s',
  // Suited connectors
  'T9s','T8s','98s','87s',
  // Offsuit
  'AKo','AQo','AJo','ATo','KQo','KJo',
]

// HJ 100bb — ~20%
const HJ_100_OPEN: HandNotation[] = [
  // Paires
  'AA','KK','QQ','JJ','TT','99','88','77','66','55',
  // Suited Aces
  'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
  // Suited Kings
  'KQs','KJs','KTs','K9s','K8s','K7s',
  // Suited Queens/Jacks
  'QJs','QTs','Q9s','Q8s','JTs','J9s','J8s',
  // Suited connectors
  'T9s','T8s','98s','97s','87s','86s','76s','65s',
  // Offsuit
  'AKo','AQo','AJo','ATo','KQo','KJo','KTo','QJo',
]

// CO 100bb — ~26%
const CO_100_OPEN: HandNotation[] = [
  // Paires
  'AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
  // Suited Aces
  'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
  // Suited Kings
  'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s','K3s','K2s',
  // Suited Queens/Jacks
  'QJs','QTs','Q9s','Q8s','Q7s','Q6s','JTs','J9s','J8s','J7s',
  // Suited connectors
  'T9s','T8s','T7s','T6s','98s','97s','96s','87s','86s','85s','76s','75s','65s','64s','54s',
  // Offsuit
  'AKo','AQo','AJo','ATo','A9o','A8o','KQo','KJo','KTo','QJo','QTo','JTo',
]

// BTN 100bb — ~42%
const BTN_100_OPEN: HandNotation[] = [
  // Paires — toutes
  'AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
  // Suited Aces — toutes
  'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
  // Suited Kings — toutes
  'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s','K3s','K2s',
  // Suited Queens
  'QJs','QTs','Q9s','Q8s','Q7s','Q6s','Q5s','Q4s','Q3s','Q2s',
  // Suited Jacks
  'JTs','J9s','J8s','J7s','J6s','J5s',
  // Suited Tens
  'T9s','T8s','T7s','T6s','T5s',
  // Suited connectors / gappers
  '98s','97s','96s','95s','87s','86s','85s','76s','75s','74s','65s','64s','63s','54s','53s','43s',
  // Offsuit
  'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o','A4o','A3o','A2o',
  'KQo','KJo','KTo','K9o','K8o','K7o',
  'QJo','QTo','Q9o',
  'JTo','J9o','T9o',
]

// SB 100bb — ~37% (RFI, pas de limp)
const SB_100_OPEN: HandNotation[] = [
  // Paires — toutes
  'AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
  // Suited Aces — toutes
  'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
  // Suited Kings
  'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s',
  // Suited Queens/Jacks
  'QJs','QTs','Q9s','Q8s','Q7s','Q6s','Q5s',
  'JTs','J9s','J8s','J7s','J6s',
  'T9s','T8s','T7s','T6s',
  // Suited connectors
  '98s','97s','96s','87s','86s','85s','76s','75s','65s','64s','54s','53s','43s',
  // Offsuit
  'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o','A4o','A3o',
  'KQo','KJo','KTo','K9o','K8o',
  'QJo','QTo',
  'JTo','T9o',
]

// ─── 40bb Ranges (short-stack, jeu plus tight) ────────────────────────────────

const UTG_40_OPEN: HandNotation[] = [
  'AA','KK','QQ','JJ','TT','99','88','77',
  'AKs','AQs','AJs','ATs','A9s','A5s',
  'KQs','KJs','KTs',
  'QJs','QTs','JTs',
  'AKo','AQo','AJo','ATo','KQo','KJo',
]

const HJ_40_OPEN: HandNotation[] = [
  'AA','KK','QQ','JJ','TT','99','88','77','66',
  'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A5s','A4s','A3s','A2s',
  'KQs','KJs','KTs','K9s',
  'QJs','QTs','Q9s','JTs','J9s',
  'T9s','T8s','98s','87s','76s',
  'AKo','AQo','AJo','ATo','KQo','KJo','QJo',
]

const CO_40_OPEN: HandNotation[] = [
  'AA','KK','QQ','JJ','TT','99','88','77','66','55','44',
  'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
  'KQs','KJs','KTs','K9s','K8s','K7s',
  'QJs','QTs','Q9s','Q8s','JTs','J9s','J8s',
  'T9s','T8s','T7s','98s','97s','87s','86s','76s','65s','54s',
  'AKo','AQo','AJo','ATo','A9o','KQo','KJo','KTo','QJo','JTo',
]

const BTN_40_OPEN: HandNotation[] = [
  'AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
  'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
  'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s',
  'QJs','QTs','Q9s','Q8s','Q7s','Q6s',
  'JTs','J9s','J8s','J7s',
  'T9s','T8s','T7s',
  '98s','97s','87s','86s','76s','75s','65s','64s','54s',
  'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o',
  'KQo','KJo','KTo','K9o',
  'QJo','QTo','JTo','T9o',
]

const SB_40_OPEN: HandNotation[] = [
  'AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
  'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
  'KQs','KJs','KTs','K9s','K8s','K7s','K6s',
  'QJs','QTs','Q9s','Q8s','Q7s',
  'JTs','J9s','J8s','J7s',
  'T9s','T8s','T7s',
  '98s','97s','87s','86s','76s','65s','54s',
  'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o',
  'KQo','KJo','KTo','K9o','K8o',
  'QJo','QTo','JTo',
]

// ─── 20bb Ranges (Push/Fold) ──────────────────────────────────────────────────
// À 20bb on push all-in ou on fold. Action = 'open' (= push)

const UTG_20_OPEN: HandNotation[] = [
  'AA','KK','QQ','JJ','TT','99','88',
  'AKs','AQs','AJs','ATs','A9s','A5s',
  'KQs','KJs',
  'QJs',
  'AKo','AQo','AJo','ATo','KQo',
]

const HJ_20_OPEN: HandNotation[] = [
  'AA','KK','QQ','JJ','TT','99','88','77',
  'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A5s','A4s','A2s',
  'KQs','KJs','KTs',
  'QJs','QTs','JTs',
  'AKo','AQo','AJo','ATo','A9o','KQo','KJo',
]

const CO_20_OPEN: HandNotation[] = [
  'AA','KK','QQ','JJ','TT','99','88','77','66',
  'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
  'KQs','KJs','KTs','K9s',
  'QJs','QTs','Q9s','JTs','J9s',
  'T9s','98s','87s',
  'AKo','AQo','AJo','ATo','A9o','A8o','KQo','KJo','QJo',
]

const BTN_20_OPEN: HandNotation[] = [
  'AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33',
  'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
  'KQs','KJs','KTs','K9s','K8s','K7s','K6s',
  'QJs','QTs','Q9s','Q8s','Q7s',
  'JTs','J9s','J8s',
  'T9s','T8s','98s','87s','76s','65s',
  'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o',
  'KQo','KJo','KTo','K9o',
  'QJo','QTo','JTo',
]

const SB_20_OPEN: HandNotation[] = [
  'AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
  'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
  'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s',
  'QJs','QTs','Q9s','Q8s',
  'JTs','J9s','J8s',
  'T9s','T8s',
  '98s','87s','76s','65s','54s',
  'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o','A4o',
  'KQo','KJo','KTo','K9o','K8o',
  'QJo','JTo',
]

// ─── Range definitions ───────────────────────────────────────────────────────

interface PrebuiltRangeDefinition {
  position: Position
  stackSize: StackSize
  name: string
  hands: HandNotation[]
}

export const PREBUILT_DEFINITIONS: PrebuiltRangeDefinition[] = [
  // 100bb
  { position: 'UTG',  stackSize: '100bb', name: 'UTG 100bb',  hands: UTG_100_OPEN },
  { position: 'HJ',   stackSize: '100bb', name: 'HJ 100bb',   hands: HJ_100_OPEN  },
  { position: 'CO',   stackSize: '100bb', name: 'CO 100bb',   hands: CO_100_OPEN  },
  { position: 'BTN',  stackSize: '100bb', name: 'BTN 100bb',  hands: BTN_100_OPEN },
  { position: 'SB',   stackSize: '100bb', name: 'SB 100bb',   hands: SB_100_OPEN  },
  // 40bb
  { position: 'UTG',  stackSize: '40bb',  name: 'UTG 40bb',   hands: UTG_40_OPEN  },
  { position: 'HJ',   stackSize: '40bb',  name: 'HJ 40bb',    hands: HJ_40_OPEN   },
  { position: 'CO',   stackSize: '40bb',  name: 'CO 40bb',    hands: CO_40_OPEN   },
  { position: 'BTN',  stackSize: '40bb',  name: 'BTN 40bb',   hands: BTN_40_OPEN  },
  { position: 'SB',   stackSize: '40bb',  name: 'SB 40bb',    hands: SB_40_OPEN   },
  // 20bb (push/fold)
  { position: 'UTG',  stackSize: '20bb',  name: 'UTG 20bb (push)', hands: UTG_20_OPEN },
  { position: 'HJ',   stackSize: '20bb',  name: 'HJ 20bb (push)',  hands: HJ_20_OPEN  },
  { position: 'CO',   stackSize: '20bb',  name: 'CO 20bb (push)',  hands: CO_20_OPEN  },
  { position: 'BTN',  stackSize: '20bb',  name: 'BTN 20bb (push)', hands: BTN_20_OPEN },
  { position: 'SB',   stackSize: '20bb',  name: 'SB 20bb (push)',  hands: SB_20_OPEN  },
]

export function buildPrebuiltRange(def: PrebuiltRangeDefinition): Range {
  return {
    id: `prebuilt-${def.position}-${def.stackSize}`,
    name: def.name,
    position: def.position,
    stackSize: def.stackSize,
    hands: makeHands(def.hands),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}
