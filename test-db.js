const { getDb } = require("./src/lib/db");
const { getAllLevels, getPlayer, createOrUpdatePlayer } = require("./src/lib/queries");

try {
  const db = getDb();
  console.log("Database initialized successfully");

  const levels = getAllLevels();
  console.log(`Found ${levels.length} levels:`);
  levels.forEach((l) => {
    console.log(`  - ${l.id}: ${l.name} (${l.difficulty})`);
  });

  const player = getPlayer("local-player");
  console.log(`\nPlayer: ${player?.name}, score: ${player?.totalScore}`);

  console.log("\n✅ All tests passed!");
} catch (e) {
  console.error("❌ Test failed:", e);
  process.exit(1);
}
