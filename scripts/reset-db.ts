import { initDb, getDbPath, closeDb, exec } from '../src/lib/db';
import fs from 'fs';

async function main() {
  console.log('WARNING: This will DELETE ALL DATA in the database!');
  console.log(`Database: ${getDbPath()}`);

  await initDb();

  console.log('\nDropping all data...');
  exec(`DELETE FROM repair_reports; DELETE FROM score_records; DELETE FROM operations; DELETE FROM game_sessions; DELETE FROM cracks; DELETE FROM puzzle_pieces; DELETE FROM levels; DELETE FROM players; DELETE FROM app_state;`);
  console.log('All data cleared.');

  closeDb();

  const dbPath = getDbPath();
  console.log('\nDatabase reset complete. Now run "npm run db:init" to reinitialize.');
}

main().catch(err => {
  console.error('Database reset failed:', err);
  process.exit(1);
});
