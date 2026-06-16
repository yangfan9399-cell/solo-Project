import { initDb, closeDb } from '../src/lib/db';
import { initSchema } from '../src/lib/schema';
import { insertLevel, insertPiece, insertCrack, setAppState, listLevels, createPlayer } from '../src/lib/repositories';
import { SEED_LEVELS, generateLevelData } from './level-generator';

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f');

  await initDb();
  initSchema();

  const existingLevels = listLevels();
  if (existingLevels.length > 0 && !force) {
    console.log(`Levels table already has ${existingLevels.length} entries.`);
    console.log('Use --force flag to re-seed (this will clear existing levels).');
    closeDb();
    process.exit(0);
  }

  if (force) {
    console.log('Force flag detected. Clearing existing data...');
    const { exec } = await import('../src/lib/db');
    exec(`DELETE FROM cracks; DELETE FROM puzzle_pieces; DELETE FROM levels;`);
  }

  console.log('Seeding levels and data...\n');

  for (let i = 0; i < SEED_LEVELS.length; i++) {
    const levelDef = SEED_LEVELS[i];
    const levelId = i + 1;
    const insertedId = insertLevel({ ...levelDef, id: levelId });
    console.log(`  Level ${insertedId}: ${levelDef.name}`);

    const { pieces, cracks } = generateLevelData(levelId, levelDef);
    for (const piece of pieces) {
      insertPiece(piece);
    }
    console.log(`    Pieces: ${pieces.length}, Cracks: ${cracks.length}`);

    for (const crack of cracks) {
      insertCrack(crack);
    }
  }

  setAppState('db_seeded_at', Date.now().toString());
  console.log('\nSeed data inserted successfully!');
  closeDb();
}

main().catch(err => {
  console.error('Seed data insertion failed:', err);
  process.exit(1);
});
