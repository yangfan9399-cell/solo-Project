export interface Book {
  id: number;
  title: string;
  author: string;
  publishYear: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  conditionDesc: string;
  hasInscription: boolean;
  inscription: string | null;
  hasSeal: boolean;
  sealName: string | null;
  sealOwner: string | null;
  isRare: boolean;
  rarityLevel: 'common' | 'uncommon' | 'rare' | 'first_edition' | 'out_of_print';
  rarityDesc: string;
  basePrice: number;
  actualValue: number;
  category: string;
  coverImage: string | null;
}

export interface BlindBox {
  id: number;
  sessionId: number;
  name: string;
  description: string;
  books: Book[];
  totalBasePrice: number;
  totalActualValue: number;
  createdAt: string;
}

export interface Customer {
  id: number;
  name: string;
  avatar: string;
  preferences: string[];
  budgetRange: [number, number];
  personality: 'casual' | 'serious' | 'collector' | 'bargain_hunter';
  tolerance: number;
}

export type GamePhase = 
  | 'created' 
  | 'inventory' 
  | 'pricing' 
  | 'reveal' 
  | 'customer_feedback' 
  | 'return_event' 
  | 'settled';

export interface GameSession {
  id: number;
  playerId: string;
  phase: GamePhase;
  roundNumber: number;
  totalScore: number;
  currentMoney: number;
  inventoryCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface MainRecord {
  id: number;
  sessionId: number;
  roundNumber: number;
  blindBoxId: number;
  playerPrice: number | null;
  marketSuggestedPrice: number;
  status: 'pending' | 'priced' | 'sold' | 'overstock' | 'returned';
  createdAt: string;
}

export interface DetailRecord {
  id: number;
  mainRecordId: number;
  bookId: number;
  condition: string;
  conditionDesc: string;
  conditionWeight: number;
  hasInscription: boolean;
  inscriptionContent: string | null;
  clueRevealed: boolean;
  createdAt: string;
}

export interface HistoryRecord {
  id: number;
  mainRecordId: number;
  bookId: number;
  hasSeal: boolean;
  sealName: string | null;
  sealOwner: string | null;
  sealProvenance: string | null;
  sealValueMultiplier: number;
  historicalNote: string | null;
  createdAt: string;
}

export interface ResultRecord {
  id: number;
  mainRecordId: number;
  bookId: number;
  isRare: boolean;
  rarityLevel: string;
  rarityDesc: string;
  rarityMultiplier: number;
  customerPreference: string;
  customerPreferenceMatch: boolean;
  preferenceBonus: number;
  finalValue: number;
  createdAt: string;
}

export interface PricingFeedback {
  id: number;
  mainRecordId: number;
  customerId: number;
  customerName: string;
  reaction: 'delighted' | 'satisfied' | 'neutral' | 'disappointed' | 'angry';
  feedback: string;
  purchased: boolean;
  priceDifference: number;
  priceDifferencePercent: number;
  createdAt: string;
}

export interface ReturnEvent {
  id: number;
  mainRecordId: number;
  bookId: number;
  reason: string;
  refundAmount: number;
  damagePenalty: number;
  impactOnReputation: number;
  createdAt: string;
}

export interface PricePoint {
  price: number;
  demand: number;
  timestamp: string;
}

export interface LedgerEntry {
  id: number;
  sessionId: number;
  roundNumber: number;
  type: 'inventory' | 'sale' | 'return' | 'refund' | 'penalty' | 'rollback';
  amount: number;
  description: string;
  referenceId: number | null;
  createdAt: string;
  rolledBack: boolean;
  rollbackId: number | null;
}

export interface RoundSummary {
  roundNumber: number;
  blindBoxBefore: BlindBox;
  blindBoxAfter: BlindBox;
  playerPrice: number;
  actualValue: number;
  profit: number;
  feedback: PricingFeedback | null;
  returnEvent: ReturnEvent | null;
  priceCurve: PricePoint[];
  scoreGained: number;
}
