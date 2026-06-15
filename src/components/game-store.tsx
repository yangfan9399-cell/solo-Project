import { createContextId, useContextProvider, useStore, component$, Slot } from '@builder.io/qwik';
import type {
  GameSession,
  BlindBox,
  Customer,
  PricingFeedback,
  ReturnEvent,
  RoundSummary,
  PricePoint,
  LedgerEntry,
  DetailRecord,
  HistoryRecord,
  ResultRecord,
  MainRecord,
} from '~/types/game';

export interface GameState {
  sessionId: number | null;
  playerId: string | null;
  session: GameSession | null;
  currentRound: number;
  phase: string;
  blindBox: BlindBox | null;
  customer: Customer | null;
  clues: {
    conditionClues: Array<{ condition: string; desc: string; weight: number; hasInscription: boolean }>;
    historyClues: Array<{ hasSeal: boolean; sealName: string | null; sealOwner: string | null }>;
    resultClues: Array<{ isRare: boolean; rarityLevel: string; rarityDesc: string }>;
  } | null;
  mainRecordId: number | null;
  marketSuggestedPrice: number | null;
  playerPrice: number;
  feedback: PricingFeedback | null;
  returnEvent: ReturnEvent | null;
  roundSummary: RoundSummary | null;
  priceCurve: PricePoint[];
  ledgerEntries: LedgerEntry[];
  detailRecords: DetailRecord[];
  historyRecords: HistoryRecord[];
  resultRecords: ResultRecord[];
  allRounds: Array<{
    roundNumber: number;
    mainRecord: MainRecord | null;
    blindBox: BlindBox | null;
    detailRecords: DetailRecord[];
    historyRecords: HistoryRecord[];
    resultRecords: ResultRecord[];
    feedback: PricingFeedback | null;
    returnEvent: ReturnEvent | null;
    priceCurve: PricePoint[];
  }>;
  isLoading: boolean;
  error: string | null;
  totalScore: number;
  currentMoney: number;
}

export const GameContext = createContextId<GameState>('game-context');

export function createGameStore(): GameState {
  return useStore<GameState>({
    sessionId: null,
    playerId: null,
    session: null,
    currentRound: 0,
    phase: 'created',
    blindBox: null,
    customer: null,
    clues: null,
    mainRecordId: null,
    marketSuggestedPrice: null,
    playerPrice: 0,
    feedback: null,
    returnEvent: null,
    roundSummary: null,
    priceCurve: [],
    ledgerEntries: [],
    detailRecords: [],
    historyRecords: [],
    resultRecords: [],
    allRounds: [],
    isLoading: false,
    error: null,
    totalScore: 0,
    currentMoney: 1000,
  });
}

export function provideGameStore(store: GameState): void {
  useContextProvider(GameContext, store);
}

export const GameStoreProvider = component$(() => {
  const store = createGameStore();
  provideGameStore(store);
  return <Slot />;
});
