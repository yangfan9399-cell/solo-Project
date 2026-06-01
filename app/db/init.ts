import { db } from "./index";
import { schema } from "./schema";

console.log("Initializing database...");

try {
  db.exec(schema);
  console.log("Database schema created successfully!");
} catch (error) {
  console.error("Error creating database schema:", error);
  process.exit(1);
}
