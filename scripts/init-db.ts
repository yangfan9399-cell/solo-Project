import { initDb, getDb } from '../src/server/db';
import { insertBook, insertCustomer, insertSeedSample, getAllBooks, getAllCustomers } from '../src/server/repositories';
import { seedBooks, seedCustomers, seedScenarios } from './seed-data';
import {
  createNewGame,
  startNewRound,
  createMainRecords,
  submitPrice,
  recordInventoryCost,
  recordSale,
  recordReturn,
  calculateRoundScore,
} from '../src/server/gameService';
import type { Book, Customer } from '~/types/game';

async function initSeedData(): Promise<void> {
  console.log('Initializing seed data...');
  
  const existingBooks = await getAllBooks();
  if (existingBooks.length === 0) {
    console.log('Inserting seed books...');
    for (const book of seedBooks) {
      await insertBook(book as Book);
    }
    console.log(`Inserted ${seedBooks.length} books`);
  } else {
    console.log(`Books already exist: ${existingBooks.length}`);
  }
  
  const existingCustomers = await getAllCustomers();
  if (existingCustomers.length === 0) {
    console.log('Inserting seed customers...');
    for (const customer of seedCustomers) {
      await insertCustomer(customer as Customer);
    }
    console.log(`Inserted ${seedCustomers.length} customers`);
  } else {
    console.log(`Customers already exist: ${existingCustomers.length}`);
  }
  
  console.log('Creating seed scenarios...');
  await createSeedScenario1();
  await createSeedScenario2();
  await createSeedScenario3();
  
  console.log('Seed data initialization complete!');
}

async function createSeedScenario1(): Promise<void> {
  console.log('\n=== Creating Seed Scenario 1: 定价过高导致积压 ===');
  
  const { sessionId, playerId } = await createNewGame();
  console.log(`Created session: ${sessionId} for player: ${playerId}`);
  
  const { blindBox, customer } = await startNewRound(sessionId);
  console.log(`Created blind box: ${blindBox.name}`);
  console.log(`Customer: ${customer.name}, budget: ¥${customer.budgetRange[0]}-¥${customer.budgetRange[1]}`);
  
  const { mainRecordId, marketSuggestedPrice } = await createMainRecords(
    sessionId,
    1,
    blindBox.id,
    blindBox,
    customer
  );
  console.log(`Market suggested price: ¥${marketSuggestedPrice}`);
  
  await recordInventoryCost(sessionId, 1, blindBox);
  
  const overpriced = Math.round(marketSuggestedPrice * 2.5);
  console.log(`Player sets price to: ¥${overpriced} (overpriced)`);
  
  const { feedback } = await submitPrice(sessionId, mainRecordId, overpriced, customer, blindBox);
  console.log(`Customer reaction: ${feedback.reaction}`);
  console.log(`Customer purchased: ${feedback.purchased}`);
  console.log(`Feedback: ${feedback.feedback}`);
  
  await recordSale(sessionId, 1, mainRecordId, overpriced, feedback.purchased);
  
  const { score, roundSummary } = await calculateRoundScore(sessionId, mainRecordId);
  console.log(`Round score: ${score}`);
  console.log(`Profit: ¥${roundSummary.profit.toFixed(2)}`);
  
  await insertSeedSample(
    seedScenarios[0].name,
    seedScenarios[0].description,
    seedScenarios[0].scenarioType,
    sessionId
  );
  
  console.log('=== Scenario 1 Complete ===\n');
}

async function createSeedScenario2(): Promise<void> {
  console.log('\n=== Creating Seed Scenario 2: 定价过低损失稀缺书利润 ===');
  
  const { sessionId, playerId } = await createNewGame();
  console.log(`Created session: ${sessionId} for player: ${playerId}`);
  
  const { blindBox, customer } = await startNewRound(sessionId);
  console.log(`Created blind box: ${blindBox.name}`);
  console.log(`Books in box:`);
  blindBox.books.forEach((book, i) => {
    console.log(`  ${i + 1}. ${book.title} - ${book.rarityLevel} - ¥${book.actualValue}`);
  });
  console.log(`Customer: ${customer.name}, preferences: ${customer.preferences.join(', ')}`);
  
  const { mainRecordId, marketSuggestedPrice } = await createMainRecords(
    sessionId,
    1,
    blindBox.id,
    blindBox,
    customer
  );
  console.log(`Total actual value: ¥${blindBox.totalActualValue}`);
  console.log(`Market suggested price: ¥${marketSuggestedPrice}`);
  
  await recordInventoryCost(sessionId, 1, blindBox);
  
  const underpriced = Math.round(blindBox.totalActualValue * 0.4);
  console.log(`Player sets price to: ¥${underpriced} (severely underpriced for rare books)`);
  
  const { feedback, isReturnTriggered, returnEvent } = await submitPrice(sessionId, mainRecordId, underpriced, customer, blindBox);
  console.log(`Customer reaction: ${feedback.reaction}`);
  console.log(`Customer purchased: ${feedback.purchased}`);
  console.log(`Price difference: ${feedback.priceDifferencePercent.toFixed(1)}%`);
  
  if (isReturnTriggered && returnEvent) {
    console.log(`\n⚠️  RETURN EVENT TRIGGERED!`);
    console.log(`Reason: ${returnEvent.reason}`);
    console.log(`Refund: ¥${returnEvent.refundAmount.toFixed(2)}`);
    console.log(`Damage penalty: ¥${returnEvent.damagePenalty.toFixed(2)}`);
    console.log(`Reputation impact: ${returnEvent.impactOnReputation.toFixed(1)}`);
    await recordReturn(sessionId, 1, mainRecordId, returnEvent);
  }
  
  await recordSale(sessionId, 1, mainRecordId, underpriced, feedback.purchased);
  
  const { score, roundSummary } = await calculateRoundScore(sessionId, mainRecordId);
  console.log(`\nRound score: ${score}`);
  console.log(`Potential profit lost: ¥${(blindBox.totalActualValue - underpriced).toFixed(2)}`);
  console.log(`Actual profit: ¥${roundSummary.profit.toFixed(2)}`);
  
  const rareBooks = blindBox.books.filter(b => b.isRare);
  if (rareBooks.length > 0) {
    console.log(`\n⚠️  ANOMALY: Lost profit on rare books!`);
    rareBooks.forEach(book => {
      console.log(`  - ${book.title}: should be ¥${book.actualValue}, sold at fraction of value`);
    });
  }
  
  await insertSeedSample(
    seedScenarios[1].name,
    seedScenarios[1].description,
    seedScenarios[1].scenarioType,
    sessionId
  );
  
  console.log('=== Scenario 2 Complete ===\n');
}

async function createSeedScenario3(): Promise<void> {
  console.log('\n=== Creating Seed Scenario 3: 进货台账需要回滚或重算 ===');
  
  const { sessionId, playerId } = await createNewGame();
  console.log(`Created session: ${sessionId} for player: ${playerId}`);
  
  const { blindBox, customer } = await startNewRound(sessionId);
  console.log(`Created blind box: ${blindBox.name}`);
  console.log(`Books in box:`);
  blindBox.books.forEach((book, i) => {
    console.log(`  ${i + 1}. ${book.title} - ${book.rarityLevel}`);
  });
  
  const { mainRecordId, marketSuggestedPrice } = await createMainRecords(
    sessionId,
    1,
    blindBox.id,
    blindBox,
    customer
  );
  console.log(`Market suggested price: ¥${marketSuggestedPrice}`);
  
  const ledgerEntry = await recordInventoryCost(sessionId, 1, blindBox);
  console.log(`Inventory cost recorded: ¥${Math.abs(ledgerEntry.amount).toFixed(2)}`);
  
  console.log(`\n⚠️  LEDGER ERROR DETECTED!`);
  console.log(`The inventory cost was miscalculated. Need to rollback and recalculate.`);
  console.log(`Rolling back ledger entry #${ledgerEntry.id}...`);
  
  const db = await getDb();
  
  const result = db.exec('SELECT * FROM ledger_entries WHERE id = ?', [ledgerEntry.id]);
  const entry: any = {};
  if (result.length > 0 && result[0].values.length > 0) {
    const columns = result[0].columns;
    result[0].values[0].forEach((val, idx) => {
      entry[columns[idx]] = val;
    });
  }
  
  db.run('UPDATE ledger_entries SET rolled_back = 1 WHERE id = ?', [ledgerEntry.id]);
  
  const correctCost = blindBox.totalBasePrice * 0.5;
  db.run(`
    INSERT INTO ledger_entries (session_id, round_number, type, amount, description, reference_id, rolled_back, rollback_id)
    VALUES (?, ?, 'rollback', ?, ?, ?, 0, ?)
  `, [
    sessionId,
    1,
    entry.amount,
    `回滚错误的进货成本记录 #${ledgerEntry.id}`,
    ledgerEntry.id,
    ledgerEntry.id
  ]);
  
  db.run(`
    INSERT INTO ledger_entries (session_id, round_number, type, amount, description, reference_id, rolled_back, rollback_id)
    VALUES (?, ?, 'inventory', ?, ?, ?, 0, NULL)
  `, [
    sessionId,
    1,
    -correctCost,
    `更正后的进货成本 - ${blindBox.name}`,
    blindBox.id
  ]);
  
  const sessionResult = db.exec('SELECT * FROM game_sessions WHERE id = ?', [sessionId]);
  let session: any = {};
  if (sessionResult.length > 0 && sessionResult[0].values.length > 0) {
    const columns = sessionResult[0].columns;
    sessionResult[0].values[0].forEach((val, idx) => {
      session[columns[idx]] = val;
    });
  }
  
  const correctedMoney = session.current_money + Math.abs(ledgerEntry.amount) - correctCost;
  db.run('UPDATE game_sessions SET current_money = ?, inventory_cost = ? WHERE id = ?', [
    correctedMoney,
    correctCost,
    sessionId
  ]);
  
  console.log(`Corrected inventory cost: ¥${correctCost.toFixed(2)}`);
  console.log(`Updated current money: ¥${correctedMoney.toFixed(2)}`);
  
  console.log(`\nNow proceeding with pricing...`);
  const playerPrice = Math.round(marketSuggestedPrice * 1.05);
  console.log(`Player sets price to: ¥${playerPrice}`);
  
  const { feedback } = await submitPrice(sessionId, mainRecordId, playerPrice, customer, blindBox);
  console.log(`Customer reaction: ${feedback.reaction}`);
  console.log(`Customer purchased: ${feedback.purchased}`);
  
  await recordSale(sessionId, 1, mainRecordId, playerPrice, feedback.purchased);
  
  console.log(`\nRecalculating score with corrected ledger...`);
  const { score, roundSummary } = await calculateRoundScore(sessionId, mainRecordId);
  console.log(`Round score: ${score}`);
  console.log(`Profit (with corrected cost): ¥${roundSummary.profit.toFixed(2)}`);
  
  await insertSeedSample(
    seedScenarios[2].name,
    seedScenarios[2].description,
    seedScenarios[2].scenarioType,
    sessionId
  );
  
  console.log('=== Scenario 3 Complete ===\n');
}

async function main() {
  try {
    console.log('Starting database initialization...');
    await initDb();
    await initSeedData();
    console.log('\n✅ Database initialization successful!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

main();
