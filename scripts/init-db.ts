import { initSchema } from '../src/lib/schema';
import { getAppState, setAppState, listLevels, insertLevel, insertPiece, insertCrack } from '../src/lib/repositories';
import { initDb, closeDb } from '../src/lib/db';
import { SEED_LEVELS, generateLevelData } from './level-generator';

async function main() {
  console.log('Initializing database...');
  await initDb();

  console.log('Creating schema...');
  initSchema();

  const initialized = getAppState('db_initialized');
  if (initialized === 'true') {
    const existingLevels = listLevels();
    if (existingLevels.length > 0) {
      console.log(`Database already initialized with ${existingLevels.length} levels. Skipping seed data.`);
      console.log('Use "npm run db:reset" to reset the database.');
      closeDb();
      return;
    }
  }

  console.log('Seeding initial levels data...\n');

  for (let i = 0; i < SEED_LEVELS.length; i++) {
    const levelDef = SEED_LEVELS[i];
    const levelId = i + 1;
    const insertedId = insertLevel({ ...levelDef, id: levelId });
    console.log(`  Level ${insertedId}: ${levelDef.name} [${levelDef.difficulty.toUpperCase()}]`);

    const { pieces, cracks } = generateLevelData(levelId, levelDef);
    for (const piece of pieces) {
      insertPiece(piece);
    }
    console.log(`    - ${pieces.length} puzzle pieces generated`);

    for (const crack of cracks) {
      insertCrack(crack);
    }
    console.log(`    - ${cracks.length} crack records generated`);
  }

  setAppState('db_initialized', 'true');
  setAppState('db_version', '1.0.0');

  console.log('\nDatabase initialization completed successfully!');
  console.log(`Database location: ${require('path').resolve(process.cwd(), 'data/game.db')}`);
  closeDb();
}

main().catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});
