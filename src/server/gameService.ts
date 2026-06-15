import {
  insertGameSession,
  getGameSessionById,
  updateGameSessionPhase,
  updateGameSession,
  insertBlindBox,
  getBlindBoxById,
  insertMainRecord,
  getMainRecordById,
  getMainRecordBySessionAndRound,
  updateMainRecord,
  insertDetailRecord,
  getDetailRecordsByMainId,
  insertHistoryRecord,
  getHistoryRecordsByMainId,
  insertResultRecord,
  getResultRecordsByMainId,
  insertPricingFeedback,
  getPricingFeedbackByMainId,
  insertReturnEvent,
  getReturnEventByMainId,
  insertPriceCurvePoint,
  getPriceCurveByMainId,
  insertLedgerEntry,
  getLedgerEntriesBySession,
  rollbackLedgerEntry,
  getRandomBooks,
  getRandomCustomer,
} from './repositories';
import { getDb } from './db';
import type {
  Book,
  BlindBox,
  Customer,
  GameSession,
  MainRecord,
  DetailRecord,
  HistoryRecord,
  ResultRecord,
  PricingFeedback,
  ReturnEvent,
  PricePoint,
  LedgerEntry,
  RoundSummary,
} from '~/types/game';

function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function calculateConditionWeight(condition: string): number {
  const weights: Record<string, number> = {
    excellent: 1.3,
    good: 1.0,
    fair: 0.7,
    poor: 0.4,
  };
  return weights[condition] || 1.0;
}

function calculateSealMultiplier(hasSeal: boolean, sealOwner: string | null): number {
  if (!hasSeal) return 1.0;
  if (sealOwner?.includes('知名') || sealOwner?.includes('教授') || sealOwner?.includes('作家')) return 1.5;
  if (sealOwner?.includes('私人') || sealOwner?.includes('收藏')) return 1.2;
  return 1.1;
}

function calculateRarityMultiplier(rarityLevel: string): number {
  const multipliers: Record<string, number> = {
    common: 1.0,
    uncommon: 1.3,
    rare: 1.8,
    first_edition: 2.5,
    out_of_print: 3.0,
  };
  return multipliers[rarityLevel] || 1.0;
}

function generateBlindBoxName(books: Book[]): string {
  const categories = [...new Set(books.map(b => b.category))];
  const rarities = books.filter(b => b.isRare).map(b => b.rarityLevel);
  const hasRare = rarities.length > 0;
  
  if (hasRare && rarities.includes('out_of_print')) {
    return `绝版珍藏盲盒`;
  }
  if (hasRare && rarities.includes('first_edition')) {
    return `初版精选盲盒`;
  }
  if (categories.includes('文学') && categories.includes('历史')) {
    return `文史经典盲盒`;
  }
  if (categories.includes('哲学') || categories.includes('思想')) {
    return `思想宝库盲盒`;
  }
  if (categories.includes('艺术') || categories.includes('摄影')) {
    return `艺术鉴赏盲盒`;
  }
  return `旧书惊喜盲盒`;
}

function generateBlindBoxDescription(books: Book[]): string {
  const rareCount = books.filter(b => b.isRare).length;
  const inscribedCount = books.filter(b => b.hasInscription).length;
  const sealedCount = books.filter(b => b.hasSeal).length;
  
  let desc = `内含${books.length}本精选旧书`;
  if (rareCount > 0) desc += `，其中${rareCount}本为稀缺版本`;
  if (inscribedCount > 0) desc += `，${inscribedCount}本带有作者题签`;
  if (sealedCount > 0) desc += `，${sealedCount}本盖有珍贵藏书章`;
  return desc + '。';
}

export async function createNewGame(): Promise<{ sessionId: number; playerId: string }> {
  const playerId = generatePlayerId();
  const sessionId = await insertGameSession(playerId);
  return { sessionId, playerId };
}

export async function createBlindBox(sessionId: number, roundNumber: number): Promise<BlindBox> {
  const books = await getRandomBooks(3 + Math.floor(Math.random() * 2));
  const totalBasePrice = books.reduce((sum, b) => sum + b.basePrice, 0);
  const totalActualValue = books.reduce((sum, b) => sum + b.actualValue, 0);
  
  const blindBoxId = await insertBlindBox(
    {
      sessionId,
      name: generateBlindBoxName(books),
      description: generateBlindBoxDescription(books),
      totalBasePrice,
      totalActualValue,
    },
    books.map(b => b.id)
  );
  
  const blindBox = await getBlindBoxById(blindBoxId);
  if (!blindBox) throw new Error('Failed to create blind box');
  
  return blindBox;
}

export async function startNewRound(sessionId: number): Promise<{
  blindBox: BlindBox;
  customer: Customer;
  clues: {
    conditionClues: Array<{ condition: string; desc: string; weight: number; hasInscription: boolean }>;
    historyClues: Array<{ hasSeal: boolean; sealName: string | null; sealOwner: string | null }>;
    resultClues: Array<{ isRare: boolean; rarityLevel: string; rarityDesc: string }>;
  };
}> {
  const session = await getGameSessionById(sessionId);
  if (!session) throw new Error('Session not found');
  
  const newRoundNumber = session.roundNumber + 1;
  await updateGameSession(sessionId, { roundNumber: newRoundNumber });
  await updateGameSessionPhase(sessionId, 'pricing');
  
  const blindBox = await createBlindBox(sessionId, newRoundNumber);
  const customer = await getRandomCustomer();
  
  const conditionWeightMap: Record<string, number> = {
    excellent: 1.3,
    good: 1.0,
    fair: 0.7,
    poor: 0.4,
  };
  
  const conditionClues = blindBox.books.map(book => ({
    condition: book.condition,
    desc: book.conditionDesc,
    weight: conditionWeightMap[book.condition] || 1.0,
    hasInscription: book.hasInscription,
  }));
  
  const historyClues = blindBox.books.map(book => ({
    hasSeal: book.hasSeal,
    sealName: book.sealName,
    sealOwner: book.sealOwner,
  }));
  
  const resultClues = blindBox.books.map(book => ({
    isRare: book.isRare,
    rarityLevel: book.rarityLevel,
    rarityDesc: book.rarityDesc,
  }));
  
  return { blindBox, customer, clues: { conditionClues, historyClues, resultClues } };
}

export async function createMainRecords(
  sessionId: number,
  roundNumber: number,
  blindBoxId: number,
  blindBox: BlindBox,
  customer: Customer
): Promise<{ mainRecordId: number; marketSuggestedPrice: number }> {
  let marketSuggestedPrice = 0;
  
  for (const book of blindBox.books) {
    const conditionWeight = calculateConditionWeight(book.condition);
    const sealMultiplier = calculateSealMultiplier(book.hasSeal, book.sealOwner);
    const rarityMultiplier = calculateRarityMultiplier(book.rarityLevel);
    
    let preferenceBonus = 0;
    if (customer.preferences.some(p => book.category.includes(p) || book.title.includes(p))) {
      preferenceBonus = book.basePrice * 0.15;
    }
    
    const bookValue = book.basePrice * conditionWeight * sealMultiplier * rarityMultiplier + preferenceBonus;
    marketSuggestedPrice += bookValue;
  }
  
  marketSuggestedPrice = Math.round(marketSuggestedPrice * 100) / 100;
  
  const mainRecordId = await insertMainRecord({
    sessionId,
    roundNumber,
    blindBoxId,
    playerPrice: null,
    marketSuggestedPrice,
    status: 'pending',
  });
  
  for (const book of blindBox.books) {
    const conditionWeight = calculateConditionWeight(book.condition);
    await insertDetailRecord({
      mainRecordId,
      bookId: book.id,
      condition: book.condition,
      conditionDesc: book.conditionDesc,
      conditionWeight,
      hasInscription: book.hasInscription,
      inscriptionContent: book.inscription,
      clueRevealed: true,
    });
    
    const sealMultiplier = calculateSealMultiplier(book.hasSeal, book.sealOwner);
    await insertHistoryRecord({
      mainRecordId,
      bookId: book.id,
      hasSeal: book.hasSeal,
      sealName: book.sealName,
      sealOwner: book.sealOwner,
      sealProvenance: book.hasSeal ? '私人收藏流传' : null,
      sealValueMultiplier: sealMultiplier,
      historicalNote: book.hasSeal ? `本书曾为${book.sealOwner || '匿名收藏家'}所藏` : null,
    });
    
    const rarityMultiplier = calculateRarityMultiplier(book.rarityLevel);
    const preferenceMatch = customer.preferences.some(p => book.category.includes(p) || book.title.includes(p));
    const preferenceBonus = preferenceMatch ? book.basePrice * 0.15 : 0;
    const finalValue = book.basePrice * conditionWeight * sealMultiplier * rarityMultiplier + preferenceBonus;
    
    await insertResultRecord({
      mainRecordId,
      bookId: book.id,
      isRare: book.isRare,
      rarityLevel: book.rarityLevel,
      rarityDesc: book.rarityDesc,
      rarityMultiplier,
      customerPreference: customer.preferences.join(', '),
      customerPreferenceMatch: preferenceMatch,
      preferenceBonus,
      finalValue,
    });
  }
  
  await generatePriceCurve(mainRecordId, marketSuggestedPrice);
  
  return { mainRecordId, marketSuggestedPrice };
}

async function generatePriceCurve(mainRecordId: number, basePrice: number): Promise<void> {
  const points = [
    { price: basePrice * 0.5, demand: 0.95 },
    { price: basePrice * 0.75, demand: 0.8 },
    { price: basePrice * 0.9, demand: 0.6 },
    { price: basePrice, demand: 0.45 },
    { price: basePrice * 1.1, demand: 0.3 },
    { price: basePrice * 1.25, demand: 0.15 },
    { price: basePrice * 1.5, demand: 0.05 },
  ];
  
  for (const point of points) {
    await insertPriceCurvePoint(mainRecordId, Math.round(point.price * 100) / 100, point.demand);
  }
}

export async function submitPrice(
  sessionId: number,
  mainRecordId: number,
  playerPrice: number,
  customer: Customer,
  blindBox: BlindBox
): Promise<{
  feedback: PricingFeedback;
  isReturnTriggered: boolean;
  returnEvent: ReturnEvent | null;
}> {
  const mainRecord = await getMainRecordById(mainRecordId);
  if (!mainRecord) throw new Error('Main record not found');
  
  await updateMainRecord(mainRecordId, { playerPrice, status: 'priced' });
  await updateGameSessionPhase(sessionId, 'reveal');
  
  const actualValue = blindBox.totalActualValue;
  const priceDifference = playerPrice - actualValue;
  const priceDifferencePercent = (priceDifference / actualValue) * 100;
  
  const { reaction, feedback, purchased } = calculateCustomerReaction(
    playerPrice,
    actualValue,
    customer,
    blindBox
  );
  
  const pricingFeedback: PricingFeedback = {
    id: 0,
    mainRecordId,
    customerId: customer.id,
    customerName: customer.name,
    reaction,
    feedback,
    purchased,
    priceDifference,
    priceDifferencePercent,
    createdAt: new Date().toISOString(),
  };
  
  const feedbackId = await insertPricingFeedback(pricingFeedback);
  pricingFeedback.id = feedbackId;
  
  if (purchased) {
    await updateMainRecord(mainRecordId, { status: 'sold' });
  } else if (priceDifferencePercent > customer.tolerance * 100) {
    await updateMainRecord(mainRecordId, { status: 'overstock' });
  }
  
  await updateGameSessionPhase(sessionId, 'customer_feedback');
  
  let isReturnTriggered = false;
  let returnEvent: ReturnEvent | null = null;
  
  if (purchased && priceDifferencePercent > 40 && Math.random() < 0.5) {
    isReturnTriggered = true;
    returnEvent = await processReturnEvent(mainRecordId, blindBox, playerPrice);
    await updateGameSessionPhase(sessionId, 'return_event');
    await updateMainRecord(mainRecordId, { status: 'returned' });
  }
  
  return { feedback: pricingFeedback, isReturnTriggered, returnEvent };
}

function calculateCustomerReaction(
  playerPrice: number,
  actualValue: number,
  customer: Customer,
  blindBox: BlindBox
): { reaction: PricingFeedback['reaction']; feedback: string; purchased: boolean } {
  const diffPercent = ((playerPrice - actualValue) / actualValue) * 100;
  const tolerancePercent = customer.tolerance * 100;
  
  const hasMatchingPreference = blindBox.books.some(book =>
    customer.preferences.some(p => book.category.includes(p) || book.title.includes(p))
  );
  
  const inBudget = playerPrice >= customer.budgetRange[0] && playerPrice <= customer.budgetRange[1];
  
  let reaction: PricingFeedback['reaction'];
  let feedback: string;
  let purchased: boolean;
  
  if (diffPercent < -20) {
    reaction = 'delighted';
    feedback = `太棒了！这个价格简直是捡漏！我能感受到这些书的价值，尤其是${blindBox.books[0].title}。`;
    purchased = true;
  } else if (diffPercent < -tolerancePercent) {
    reaction = 'satisfied';
    feedback = `价格很公道，这些书的品相和内容都值得。${hasMatchingPreference ? '正好有我喜欢的类型！' : ''}`;
    purchased = true;
  } else if (Math.abs(diffPercent) <= tolerancePercent) {
    reaction = 'neutral';
    feedback = inBudget 
      ? `价格还可以，我考虑一下...好吧，成交。`
      : `价格略高于我的预算，但这些书看起来不错...成交吧。`;
    purchased = inBudget || Math.random() < 0.5;
  } else if (diffPercent < tolerancePercent * 1.5) {
    reaction = 'disappointed';
    feedback = `这个价格有点高了...${hasMatchingPreference ? '虽然有我喜欢的书，但还是超出预期。' : '我再看看吧。'}`;
    purchased = hasMatchingPreference && inBudget && Math.random() < 0.3;
  } else {
    reaction = 'angry';
    feedback = `你这是在抢钱吗？这些旧书根本不值这个价！我从没见过这么离谱的定价！`;
    purchased = false;
  }
  
  return { reaction, feedback, purchased };
}

async function processReturnEvent(
  mainRecordId: number,
  blindBox: BlindBox,
  playerPrice: number
): Promise<ReturnEvent> {
  const bookIndex = Math.floor(Math.random() * blindBox.books.length);
  const book = blindBox.books[bookIndex];
  
  const reasons = [
    `发现${book.title}内页有严重水渍，之前没有注意到`,
    `${book.title}的装订有问题，翻看时几页脱落了`,
    `回家仔细阅读发现${book.title}有大量缺页`,
    `${book.title}的签名经鉴定为伪造`,
  ];
  
  const reason = reasons[Math.floor(Math.random() * reasons.length)];
  const refundAmount = playerPrice * 0.8;
  const damagePenalty = playerPrice * 0.1;
  const impactOnReputation = 10 + Math.abs(((playerPrice - blindBox.totalActualValue) / blindBox.totalActualValue) * 20);
  
  const returnEventId = await insertReturnEvent({
    mainRecordId,
    bookId: book.id,
    reason,
    refundAmount,
    damagePenalty,
    impactOnReputation,
  });
  
  return {
    id: returnEventId,
    mainRecordId,
    bookId: book.id,
    reason,
    refundAmount,
    damagePenalty,
    impactOnReputation,
    createdAt: new Date().toISOString(),
  };
}

export async function recordInventoryCost(sessionId: number, roundNumber: number, blindBox: BlindBox): Promise<LedgerEntry> {
  const cost = blindBox.totalBasePrice * 0.6;
  
  const entry: Omit<LedgerEntry, 'id'> = {
    sessionId,
    roundNumber,
    type: 'inventory',
    amount: -cost,
    description: `进货成本 - ${blindBox.name}`,
    referenceId: blindBox.id,
    rolledBack: false,
    rollbackId: null,
  };
  
  const entryId = await insertLedgerEntry(entry);
  
  const session = await getGameSessionById(sessionId);
  if (session) {
    await updateGameSession(sessionId, {
      currentMoney: session.currentMoney - cost,
      inventoryCost: session.inventoryCost + cost,
    });
  }
  
  return { ...entry, id: entryId };
}

export async function recordSale(
  sessionId: number,
  roundNumber: number,
  mainRecordId: number,
  playerPrice: number,
  purchased: boolean
): Promise<LedgerEntry | null> {
  if (!purchased) return null;
  
  const entry: Omit<LedgerEntry, 'id'> = {
    sessionId,
    roundNumber,
    type: 'sale',
    amount: playerPrice,
    description: `盲盒销售收入`,
    referenceId: mainRecordId,
    rolledBack: false,
    rollbackId: null,
  };
  
  const entryId = await insertLedgerEntry(entry);
  
  const session = await getGameSessionById(sessionId);
  if (session) {
    await updateGameSession(sessionId, {
      currentMoney: session.currentMoney + playerPrice,
    });
  }
  
  return { ...entry, id: entryId };
}

export async function recordReturn(
  sessionId: number,
  roundNumber: number,
  mainRecordId: number,
  returnEvent: ReturnEvent
): Promise<{ refundEntry: LedgerEntry; penaltyEntry: LedgerEntry }> {
  const refundEntryData: Omit<LedgerEntry, 'id'> = {
    sessionId,
    roundNumber,
    type: 'refund',
    amount: -returnEvent.refundAmount,
    description: `退货退款 - ${returnEvent.reason}`,
    referenceId: returnEvent.id,
    rolledBack: false,
    rollbackId: null,
  };
  
  const penaltyEntryData: Omit<LedgerEntry, 'id'> = {
    sessionId,
    roundNumber,
    type: 'penalty',
    amount: -returnEvent.damagePenalty,
    description: `书籍损坏罚金`,
    referenceId: returnEvent.id,
    rolledBack: false,
    rollbackId: null,
  };
  
  const refundEntryId = await insertLedgerEntry(refundEntryData);
  const penaltyEntryId = await insertLedgerEntry(penaltyEntryData);
  
  const session = await getGameSessionById(sessionId);
  if (session) {
    await updateGameSession(sessionId, {
      currentMoney: session.currentMoney - returnEvent.refundAmount - returnEvent.damagePenalty,
    });
  }
  
  return {
    refundEntry: { ...refundEntryData, id: refundEntryId },
    penaltyEntry: { ...penaltyEntryData, id: penaltyEntryId },
  };
}

export async function calculateRoundScore(
  sessionId: number,
  mainRecordId: number
): Promise<{ score: number; roundSummary: RoundSummary }> {
  const mainRecord = await getMainRecordById(mainRecordId);
  if (!mainRecord) throw new Error('Main record not found');
  
  const blindBox = await getBlindBoxById(mainRecord.blindBoxId);
  if (!blindBox) throw new Error('Blind box not found');
  
  const detailRecords = await getDetailRecordsByMainId(mainRecordId);
  const historyRecords = await getHistoryRecordsByMainId(mainRecordId);
  const resultRecords = await getResultRecordsByMainId(mainRecordId);
  const feedback = await getPricingFeedbackByMainId(mainRecordId);
  const returnEvent = await getReturnEventByMainId(mainRecordId);
  const priceCurve = await getPriceCurveByMainId(mainRecordId);
  
  let score = 0;
  const playerPrice = mainRecord.playerPrice || 0;
  const actualValue = blindBox.totalActualValue;
  const diffPercent = ((playerPrice - actualValue) / actualValue) * 100;
  
  if (mainRecord.status === 'sold') {
    if (Math.abs(diffPercent) <= 10) {
      score += 100;
    } else if (Math.abs(diffPercent) <= 25) {
      score += 75;
    } else if (diffPercent < 0) {
      score += 50 - Math.abs(diffPercent);
    } else {
      score += Math.max(0, 60 - diffPercent);
    }
    
    const profit = playerPrice - blindBox.totalBasePrice * 0.6;
    if (profit > 0) {
      score += Math.min(50, Math.floor(profit / 10));
    }
    
    const rareBooks = resultRecords.filter(r => r.isRare);
    if (rareBooks.length > 0 && diffPercent < -10) {
      score -= rareBooks.length * 20;
    }
  } else if (mainRecord.status === 'overstock') {
    score -= 30;
    score -= Math.floor(Math.abs(diffPercent) / 5);
  } else if (mainRecord.status === 'returned') {
    score -= 50;
    if (returnEvent) {
      score -= Math.floor(returnEvent.impactOnReputation);
    }
  }
  
  const session = await getGameSessionById(sessionId);
  if (session) {
    const newTotalScore = session.totalScore + Math.max(0, score);
    await updateGameSession(sessionId, { totalScore: newTotalScore });
  }
  
  const adjustedBooks = blindBox.books.map((book, index) => {
    const result = resultRecords[index];
    const history = historyRecords[index];
    if (!result || !history) return book;
    
    return {
      ...book,
      actualValue: result.finalValue,
    };
  });
  
  const blindBoxAfter: BlindBox = {
    ...blindBox,
    books: adjustedBooks,
    totalActualValue: resultRecords.reduce((sum, r) => sum + r.finalValue, 0),
  };
  
  const roundSummary: RoundSummary = {
    roundNumber: mainRecord.roundNumber,
    blindBoxBefore: blindBox,
    blindBoxAfter,
    playerPrice,
    actualValue: blindBoxAfter.totalActualValue,
    profit: feedback?.purchased ? playerPrice - blindBox.totalBasePrice * 0.6 : -blindBox.totalBasePrice * 0.6,
    feedback,
    returnEvent,
    priceCurve,
    scoreGained: score,
  };
  
  await updateGameSessionPhase(sessionId, 'settled');
  
  return { score, roundSummary };
}

export async function getRoundData(sessionId: number, roundNumber: number) {
  const mainRecord = await getMainRecordBySessionAndRound(sessionId, roundNumber);
  if (!mainRecord) throw new Error('Round not found');
  
  const blindBox = await getBlindBoxById(mainRecord.blindBoxId);
  const detailRecords = await getDetailRecordsByMainId(mainRecord.id);
  const historyRecords = await getHistoryRecordsByMainId(mainRecord.id);
  const resultRecords = await getResultRecordsByMainId(mainRecord.id);
  const feedback = await getPricingFeedbackByMainId(mainRecord.id);
  const returnEvent = await getReturnEventByMainId(mainRecord.id);
  const priceCurve = await getPriceCurveByMainId(mainRecord.id);
  
  return {
    mainRecord,
    blindBox,
    detailRecords,
    historyRecords,
    resultRecords,
    feedback,
    returnEvent,
    priceCurve,
  };
}

export async function getFullSessionData(sessionId: number) {
  const session = await getGameSessionById(sessionId);
  if (!session) throw new Error('Session not found');
  
  const ledgerEntries = await getLedgerEntriesBySession(sessionId);
  
  const rounds: Array<{
    roundNumber: number;
    mainRecord: MainRecord | null;
    blindBox: BlindBox | null;
    detailRecords: DetailRecord[];
    historyRecords: HistoryRecord[];
    resultRecords: ResultRecord[];
    feedback: PricingFeedback | null;
    returnEvent: ReturnEvent | null;
    priceCurve: PricePoint[];
  }> = [];
  
  for (let i = 1; i <= session.roundNumber; i++) {
    const mainRecord = await getMainRecordBySessionAndRound(sessionId, i);
    if (mainRecord) {
      const blindBox = await getBlindBoxById(mainRecord.blindBoxId);
      rounds.push({
        roundNumber: i,
        mainRecord,
        blindBox,
        detailRecords: await getDetailRecordsByMainId(mainRecord.id),
        historyRecords: await getHistoryRecordsByMainId(mainRecord.id),
        resultRecords: await getResultRecordsByMainId(mainRecord.id),
        feedback: await getPricingFeedbackByMainId(mainRecord.id),
        returnEvent: await getReturnEventByMainId(mainRecord.id),
        priceCurve: await getPriceCurveByMainId(mainRecord.id),
      });
    }
  }
  
  return { session, ledgerEntries, rounds };
}

export async function recalculateSessionScore(sessionId: number): Promise<number> {
  const db = await getDb();
  const result = db.exec(`
    SELECT mr.*, bb.total_actual_value as actual_value
    FROM main_records mr
    INNER JOIN blind_boxes bb ON mr.blind_box_id = bb.id
    WHERE mr.session_id = ?
    ORDER BY mr.round_number
  `, [sessionId]);
  
  let totalScore = 0;
  
  if (result.length > 0) {
    const columns = result[0].columns;
    for (const values of result[0].values) {
      const round: any = {};
      columns.forEach((col, idx) => {
        round[col] = values[idx];
      });
      
      const playerPrice = round.player_price || 0;
      const actualValue = round.actual_value;
      const diffPercent = ((playerPrice - actualValue) / actualValue) * 100;
      
      let roundScore = 0;
      
      if (round.status === 'sold') {
        if (Math.abs(diffPercent) <= 10) {
          roundScore += 100;
        } else if (Math.abs(diffPercent) <= 25) {
          roundScore += 75;
        } else if (diffPercent < 0) {
          roundScore += 50 - Math.abs(diffPercent);
        } else {
          roundScore += Math.max(0, 60 - diffPercent);
        }
        
        const blindBox = await getBlindBoxById(round.blind_box_id);
        if (blindBox) {
          const profit = playerPrice - blindBox.totalBasePrice * 0.6;
          if (profit > 0) {
            roundScore += Math.min(50, Math.floor(profit / 10));
          }
        }
      } else if (round.status === 'overstock') {
        roundScore -= 30;
        roundScore -= Math.floor(Math.abs(diffPercent) / 5);
      } else if (round.status === 'returned') {
        roundScore -= 50;
      }
      
      totalScore += Math.max(0, Math.floor(roundScore));
    }
  }
  
  await updateGameSession(sessionId, { totalScore });
  
  return totalScore;
}

export async function rollbackRound(sessionId: number, roundNumber: number, entryId: number): Promise<number> {
  const session = await getGameSessionById(sessionId);
  if (!session) throw new Error('Session not found');
  
  return await rollbackLedgerEntry(entryId, sessionId, roundNumber);
}
