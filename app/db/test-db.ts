import { initDatabase, seedDatabase, getAllReagents, getAllUsers } from "./queries";

async function main() {
  console.log("Testing database...");
  await initDatabase();
  console.log("Schema initialized.");
  await seedDatabase();
  console.log("Data seeded.");
  
  const reagents = await getAllReagents();
  console.log("Reagents:", reagents.length);
  
  const users = await getAllUsers();
  console.log("Users:", users.length);
  
  console.log("Database working!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
