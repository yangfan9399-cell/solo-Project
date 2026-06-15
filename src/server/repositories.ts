import { getDb, saveDatabase } from './db';
import type { Book, Customer, GameSession, BlindBox, MainRecord, DetailRecord, HistoryRecord, ResultRecord, PricingFeedback, ReturnEvent, LedgerEntry, PricePoint } from '~/types/game';
import type { Database } from 'sql.js';

function getLastInsertId(db: Database): number {
  const result = db.exec('SELECT last_insert_rowid() as id');
  return result[0]?.values[0]?.[0] as number || 0;
}

function runQuery(db: Database, sql: string, params: any[] = []): number {
  db.run(sql, params);
  saveDatabase();
  return getLastInsertId(db);
}

function getOne<T>(db: Database, sql: string, params: any[] = []): T | null {
  const result = db.exec(sql, params);
  if (result.length === 0 || result[0].values.length === 0) return null;
  
  const columns = result[0].columns;
  const values = result[0].values[0];
  const row: any = {};
  columns.forEach((col, idx) => {
    row[col] = values[idx];
  });
  return row as T;
}

function getAll<T>(db: Database, sql: string, params: any[] = []): T[] {
  const result = db.exec(sql, params);
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  return result[0].values.map(values => {
    const row: any = {};
    columns.forEach((col, idx) => {
      row[col] = values[idx];
    });
    return row as T;
  });
}

export async function insertBook(book: Omit<Book, 'id'>): Promise<number> {
  const db = await getDb();
  const id = runQuery(db, `
    INSERT INTO books (title, author, publish_year, condition, condition_desc, has_inscription, inscription, has_seal, seal_name, seal_owner, is_rare, rarity_level, rarity_desc, base_price, actual_value, category, cover_image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    book.title,
    book.author,
    book.publishYear,
    book.condition,
    book.conditionDesc,
    book.hasInscription ? 1 : 0,
    book.inscription,
    book.hasSeal ? 1 : 0,
    book.sealName,
    book.sealOwner,
    book.isRare ? 1 : 0,
    book.rarityLevel,
    book.rarityDesc,
    book.basePrice,
    book.actualValue,
    book.category,
    book.coverImage,
  ]);
  return id;
}

export async function getBookById(id: number): Promise<Book | null> {
  const db = await getDb();
  const row = getOne<any>(db, 'SELECT * FROM books WHERE id = ?', [id]);
  if (!row) return null;
  return mapRowToBook(row);
}

function mapRowToBook(row: any): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    publishYear: row.publish_year,
    condition: row.condition,
    conditionDesc: row.condition_desc,
    hasInscription: row.has_inscription === 1,
    inscription: row.inscription,
    hasSeal: row.has_seal === 1,
    sealName: row.seal_name,
    sealOwner: row.seal_owner,
    isRare: row.is_rare === 1,
    rarityLevel: row.rarity_level,
    rarityDesc: row.rarity_desc,
    basePrice: row.base_price,
    actualValue: row.actual_value,
    category: row.category,
    coverImage: row.cover_image,
  };
}

export async function insertCustomer(customer: Omit<Customer, 'id'>): Promise<number> {
  const db = await getDb();
  const id = runQuery(db, `
    INSERT INTO customers (name, avatar, preferences, budget_min, budget_max, personality, tolerance)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    customer.name,
    customer.avatar,
    JSON.stringify(customer.preferences),
    customer.budgetRange[0],
    customer.budgetRange[1],
    customer.personality,
    customer.tolerance,
  ]);
  return id;
}

export async function getCustomerById(id: number): Promise<Customer | null> {
  const db = await getDb();
  const row = getOne<any>(db, 'SELECT * FROM customers WHERE id = ?', [id]);
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    preferences: JSON.parse(row.preferences),
    budgetRange: [row.budget_min, row.budget_max],
    personality: row.personality,
    tolerance: row.tolerance,
  };
}

export async function getRandomCustomer(): Promise<Customer> {
  const db = await getDb();
  const row = getOne<any>(db, 'SELECT * FROM customers ORDER BY RANDOM() LIMIT 1');
  if (!row) throw new Error('No customers found');
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    preferences: JSON.parse(row.preferences),
    budgetRange: [row.budget_min, row.budget_max],
    personality: row.personality,
    tolerance: row.tolerance,
  };
}

export async function insertGameSession(playerId: string): Promise<number> {
  const db = await getDb();
  const id = runQuery(db, `
    INSERT INTO game_sessions (player_id, phase, round_number, total_score, current_money, inventory_cost)
    VALUES (?, 'created', 0, 0, 1000, 0)
  `, [playerId]);
  return id;
}

export async function getGameSessionById(id: number): Promise<GameSession | null> {
  const db = await getDb();
  const row = getOne<any>(db, 'SELECT * FROM game_sessions WHERE id = ?', [id]);
  if (!row) return null;
  return {
    id: row.id,
    playerId: row.player_id,
    phase: row.phase,
    roundNumber: row.round_number,
    totalScore: row.total_score,
    currentMoney: row.current_money,
    inventoryCost: row.inventory_cost,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function updateGameSessionPhase(sessionId: number, phase: string): Promise<void> {
  const db = await getDb();
  runQuery(db, 'UPDATE game_sessions SET phase = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [phase, sessionId]);
}

export async function updateGameSession(sessionId: number, updates: Partial<{ roundNumber: number; totalScore: number; currentMoney: number; inventoryCost: number }>): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.roundNumber !== undefined) {
    fields.push('round_number = ?');
    values.push(updates.roundNumber);
  }
  if (updates.totalScore !== undefined) {
    fields.push('total_score = ?');
    values.push(updates.totalScore);
  }
  if (updates.currentMoney !== undefined) {
    fields.push('current_money = ?');
    values.push(updates.currentMoney);
  }
  if (updates.inventoryCost !== undefined) {
    fields.push('inventory_cost = ?');
    values.push(updates.inventoryCost);
  }
  
  if (fields.length > 0) {
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(sessionId);
    runQuery(db, `UPDATE game_sessions SET ${fields.join(', ')} WHERE id = ?`, values);
  }
}

export async function insertBlindBox(blindBox: Omit<BlindBox, 'id' | 'books'>, bookIds: number[]): Promise<number> {
  const db = await getDb();
  db.run('BEGIN TRANSACTION');
  
  try {
    const blindBoxId = runQuery(db, `
      INSERT INTO blind_boxes (session_id, name, description, total_base_price, total_actual_value)
      VALUES (?, ?, ?, ?, ?)
    `, [
      blindBox.sessionId,
      blindBox.name,
      blindBox.description,
      blindBox.totalBasePrice,
      blindBox.totalActualValue,
    ]);
    
    for (const bookId of bookIds) {
      runQuery(db, 'INSERT INTO blind_box_books (blind_box_id, book_id) VALUES (?, ?)', [blindBoxId, bookId]);
    }
    
    db.run('COMMIT');
    saveDatabase();
    return blindBoxId;
  } catch (e) {
    db.run('ROLLBACK');
    throw e;
  }
}

export async function getBlindBoxById(id: number): Promise<BlindBox | null> {
  const db = await getDb();
  const row = getOne<any>(db, 'SELECT * FROM blind_boxes WHERE id = ?', [id]);
  if (!row) return null;
  
  const bookRows = getAll<any>(db, `
    SELECT b.* FROM books b
    INNER JOIN blind_box_books bb ON b.id = bb.book_id
    WHERE bb.blind_box_id = ?
  `, [id]);
  
  return {
    id: row.id,
    sessionId: row.session_id,
    name: row.name,
    description: row.description,
    books: bookRows.map(mapRowToBook),
    totalBasePrice: row.total_base_price,
    totalActualValue: row.total_actual_value,
    createdAt: row.created_at,
  };
}

export async function insertMainRecord(record: Omit<MainRecord, 'id'>): Promise<number> {
  const db = await getDb();
  const id = runQuery(db, `
    INSERT INTO main_records (session_id, round_number, blind_box_id, player_price, market_suggested_price, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    record.sessionId,
    record.roundNumber,
    record.blindBoxId,
    record.playerPrice,
    record.marketSuggestedPrice,
    record.status,
  ]);
  return id;
}

export async function getMainRecordById(id: number): Promise<MainRecord | null> {
  const db = await getDb();
  const row = getOne<any>(db, 'SELECT * FROM main_records WHERE id = ?', [id]);
  if (!row) return null;
  return {
    id: row.id,
    sessionId: row.session_id,
    roundNumber: row.round_number,
    blindBoxId: row.blind_box_id,
    playerPrice: row.player_price,
    marketSuggestedPrice: row.market_suggested_price,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function updateMainRecord(mainRecordId: number, updates: Partial<{ playerPrice: number; status: string }>): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.playerPrice !== undefined) {
    fields.push('player_price = ?');
    values.push(updates.playerPrice);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  
  if (fields.length > 0) {
    values.push(mainRecordId);
    runQuery(db, `UPDATE main_records SET ${fields.join(', ')} WHERE id = ?`, values);
  }
}

export async function getMainRecordBySessionAndRound(sessionId: number, roundNumber: number): Promise<MainRecord | null> {
  const db = await getDb();
  const row = getOne<any>(db, 'SELECT * FROM main_records WHERE session_id = ? AND round_number = ? ORDER BY id DESC LIMIT 1', [sessionId, roundNumber]);
  if (!row) return null;
  return {
    id: row.id,
    sessionId: row.session_id,
    roundNumber: row.round_number,
    blindBoxId: row.blind_box_id,
    playerPrice: row.player_price,
    marketSuggestedPrice: row.market_suggested_price,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function insertDetailRecord(record: Omit<DetailRecord, 'id'>): Promise<number> {
  const db = await getDb();
  const id = runQuery(db, `
    INSERT INTO detail_records (main_record_id, book_id, condition, condition_desc, condition_weight, has_inscription, inscription_content, clue_revealed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    record.mainRecordId,
    record.bookId,
    record.condition,
    record.conditionDesc,
    record.conditionWeight,
    record.hasInscription ? 1 : 0,
    record.inscriptionContent,
    record.clueRevealed ? 1 : 0,
  ]);
  return id;
}

export async function getDetailRecordsByMainId(mainRecordId: number): Promise<DetailRecord[]> {
  const db = await getDb();
  const rows = getAll<any>(db, 'SELECT * FROM detail_records WHERE main_record_id = ?', [mainRecordId]);
  return rows.map(row => ({
    id: row.id,
    mainRecordId: row.main_record_id,
    bookId: row.book_id,
    condition: row.condition,
    conditionDesc: row.condition_desc,
    conditionWeight: row.condition_weight,
    hasInscription: row.has_inscription === 1,
    inscriptionContent: row.inscription_content,
    clueRevealed: row.clue_revealed === 1,
    createdAt: row.created_at,
  }));
}

export async function insertHistoryRecord(record: Omit<HistoryRecord, 'id'>): Promise<number> {
  const db = await getDb();
  const id = runQuery(db, `
    INSERT INTO history_records (main_record_id, book_id, has_seal, seal_name, seal_owner, seal_provenance, seal_value_multiplier, historical_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    record.mainRecordId,
    record.bookId,
    record.hasSeal ? 1 : 0,
    record.sealName,
    record.sealOwner,
    record.sealProvenance,
    record.sealValueMultiplier,
    record.historicalNote,
  ]);
  return id;
}

export async function getHistoryRecordsByMainId(mainRecordId: number): Promise<HistoryRecord[]> {
  const db = await getDb();
  const rows = getAll<any>(db, 'SELECT * FROM history_records WHERE main_record_id = ?', [mainRecordId]);
  return rows.map(row => ({
    id: row.id,
    mainRecordId: row.main_record_id,
    bookId: row.book_id,
    hasSeal: row.has_seal === 1,
    sealName: row.seal_name,
    sealOwner: row.seal_owner,
    sealProvenance: row.seal_provenance,
    sealValueMultiplier: row.seal_value_multiplier,
    historicalNote: row.historical_note,
    createdAt: row.created_at,
  }));
}

export async function insertResultRecord(record: Omit<ResultRecord, 'id'>): Promise<number> {
  const db = await getDb();
  const id = runQuery(db, `
    INSERT INTO result_records (main_record_id, book_id, is_rare, rarity_level, rarity_desc, rarity_multiplier, customer_preference, customer_preference_match, preference_bonus, final_value)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    record.mainRecordId,
    record.bookId,
    record.isRare ? 1 : 0,
    record.rarityLevel,
    record.rarityDesc,
    record.rarityMultiplier,
    record.customerPreference,
    record.customerPreferenceMatch ? 1 : 0,
    record.preferenceBonus,
    record.finalValue,
  ]);
  return id;
}

export async function getResultRecordsByMainId(mainRecordId: number): Promise<ResultRecord[]> {
  const db = await getDb();
  const rows = getAll<any>(db, 'SELECT * FROM result_records WHERE main_record_id = ?', [mainRecordId]);
  return rows.map(row => ({
    id: row.id,
    mainRecordId: row.main_record_id,
    bookId: row.book_id,
    isRare: row.is_rare === 1,
    rarityLevel: row.rarity_level,
    rarityDesc: row.rarity_desc,
    rarityMultiplier: row.rarity_multiplier,
    customerPreference: row.customer_preference,
    customerPreferenceMatch: row.customer_preference_match === 1,
    preferenceBonus: row.preference_bonus,
    finalValue: row.final_value,
    createdAt: row.created_at,
  }));
}

export async function insertPricingFeedback(feedback: Omit<PricingFeedback, 'id'>): Promise<number> {
  const db = await getDb();
  const id = runQuery(db, `
    INSERT INTO pricing_feedback (main_record_id, customer_id, customer_name, reaction, feedback, purchased, price_difference, price_difference_percent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    feedback.mainRecordId,
    feedback.customerId,
    feedback.customerName,
    feedback.reaction,
    feedback.feedback,
    feedback.purchased ? 1 : 0,
    feedback.priceDifference,
    feedback.priceDifferencePercent,
  ]);
  return id;
}

export async function getPricingFeedbackByMainId(mainRecordId: number): Promise<PricingFeedback | null> {
  const db = await getDb();
  const row = getOne<any>(db, 'SELECT * FROM pricing_feedback WHERE main_record_id = ? ORDER BY id DESC LIMIT 1', [mainRecordId]);
  if (!row) return null;
  return {
    id: row.id,
    mainRecordId: row.main_record_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    reaction: row.reaction,
    feedback: row.feedback,
    purchased: row.purchased === 1,
    priceDifference: row.price_difference,
    priceDifferencePercent: row.price_difference_percent,
    createdAt: row.created_at,
  };
}

export async function insertReturnEvent(event: Omit<ReturnEvent, 'id'>): Promise<number> {
  const db = await getDb();
  const id = runQuery(db, `
    INSERT INTO return_events (main_record_id, book_id, reason, refund_amount, damage_penalty, impact_on_reputation)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    event.mainRecordId,
    event.bookId,
    event.reason,
    event.refundAmount,
    event.damagePenalty,
    event.impactOnReputation,
  ]);
  return id;
}

export async function getReturnEventByMainId(mainRecordId: number): Promise<ReturnEvent | null> {
  const db = await getDb();
  const row = getOne<any>(db, 'SELECT * FROM return_events WHERE main_record_id = ? ORDER BY id DESC LIMIT 1', [mainRecordId]);
  if (!row) return null;
  return {
    id: row.id,
    mainRecordId: row.main_record_id,
    bookId: row.book_id,
    reason: row.reason,
    refundAmount: row.refund_amount,
    damagePenalty: row.damage_penalty,
    impactOnReputation: row.impact_on_reputation,
    createdAt: row.created_at,
  };
}

export async function insertPriceCurvePoint(mainRecordId: number, price: number, demand: number): Promise<number> {
  const db = await getDb();
  const id = runQuery(db, 'INSERT INTO price_curve (main_record_id, price, demand) VALUES (?, ?, ?)', [mainRecordId, price, demand]);
  return id;
}

export async function getPriceCurveByMainId(mainRecordId: number): Promise<PricePoint[]> {
  const db = await getDb();
  const rows = getAll<any>(db, 'SELECT * FROM price_curve WHERE main_record_id = ? ORDER BY created_at', [mainRecordId]);
  return rows.map(row => ({
    price: row.price,
    demand: row.demand,
    timestamp: row.created_at,
  }));
}

export async function insertLedgerEntry(entry: Omit<LedgerEntry, 'id'>): Promise<number> {
  const db = await getDb();
  const id = runQuery(db, `
    INSERT INTO ledger_entries (session_id, round_number, type, amount, description, reference_id, rolled_back, rollback_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    entry.sessionId,
    entry.roundNumber,
    entry.type,
    entry.amount,
    entry.description,
    entry.referenceId,
    entry.rolledBack ? 1 : 0,
    entry.rollbackId,
  ]);
  return id;
}

export async function getLedgerEntriesBySession(sessionId: number): Promise<LedgerEntry[]> {
  const db = await getDb();
  const rows = getAll<any>(db, 'SELECT * FROM ledger_entries WHERE session_id = ? ORDER BY created_at', [sessionId]);
  return rows.map(row => ({
    id: row.id,
    sessionId: row.session_id,
    roundNumber: row.round_number,
    type: row.type,
    amount: row.amount,
    description: row.description,
    referenceId: row.reference_id,
    createdAt: row.created_at,
    rolledBack: row.rolled_back === 1,
    rollbackId: row.rollback_id,
  }));
}

export async function rollbackLedgerEntry(entryId: number, sessionId: number, roundNumber: number): Promise<number> {
  const db = await getDb();
  db.run('BEGIN TRANSACTION');
  
  try {
    const entry = getOne<any>(db, 'SELECT * FROM ledger_entries WHERE id = ?', [entryId]);
    if (!entry || entry.rolled_back === 1) {
      db.run('ROLLBACK');
      throw new Error('Entry not found or already rolled back');
    }
    
    runQuery(db, 'UPDATE ledger_entries SET rolled_back = 1 WHERE id = ?', [entryId]);
    
    const rollbackId = runQuery(db, `
      INSERT INTO ledger_entries (session_id, round_number, type, amount, description, reference_id, rolled_back, rollback_id)
      VALUES (?, ?, 'rollback', ?, ?, ?, 0, ?)
    `, [
      sessionId,
      roundNumber,
      -entry.amount,
      `回滚: ${entry.description}`,
      entryId,
      entryId,
    ]);
    
    db.run('COMMIT');
    saveDatabase();
    return rollbackId;
  } catch (e) {
    db.run('ROLLBACK');
    throw e;
  }
}

export async function insertSeedSample(name: string, description: string, scenarioType: string, sessionId: number | null = null): Promise<number> {
  const db = await getDb();
  const id = runQuery(db, 'INSERT INTO seed_samples (name, description, scenario_type, session_id) VALUES (?, ?, ?, ?)', [name, description, scenarioType, sessionId]);
  return id;
}

export async function getAllBooks(): Promise<Book[]> {
  const db = await getDb();
  const rows = getAll<any>(db, 'SELECT * FROM books');
  return rows.map(mapRowToBook);
}

export async function getAllCustomers(): Promise<Customer[]> {
  const db = await getDb();
  const rows = getAll<any>(db, 'SELECT * FROM customers');
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    preferences: JSON.parse(row.preferences),
    budgetRange: [row.budget_min, row.budget_max],
    personality: row.personality,
    tolerance: row.tolerance,
  }));
}

export async function getRandomBooks(count: number): Promise<Book[]> {
  const db = await getDb();
  const rows = getAll<any>(db, 'SELECT * FROM books ORDER BY RANDOM() LIMIT ?', [count]);
  return rows.map(mapRowToBook);
}
