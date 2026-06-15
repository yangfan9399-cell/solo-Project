const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync(':memory:');

console.log('1. Testing exec...');
db.exec(`
  CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);
  CREATE TABLE posts (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id), title TEXT);
`);

console.log('2. Testing prepare + run...');
const insert = db.prepare('INSERT INTO users (name) VALUES (?)');
const r1 = insert.run('alice');
console.log('   run result:', r1);
console.log('   lastInsertRowid:', r1.lastInsertRowid);
console.log('   changes:', r1.changes);

console.log('3. Testing get...');
const getStmt = db.prepare('SELECT * FROM users WHERE id = ?');
const row = getStmt.get(1);
console.log('   row:', row);
console.log('   row.name:', row.name);

console.log('4. Testing all...');
insert.run('bob');
insert.run('charlie');
const allStmt = db.prepare('SELECT * FROM users ORDER BY id');
const all = allStmt.all();
console.log('   all count:', all.length);
console.log('   all names:', all.map(r => r.name));

console.log('5. Testing pragma...');
db.exec('PRAGMA journal_mode = WAL');
const journalMode = db.prepare('PRAGMA journal_mode').get();
console.log('   journal_mode:', journalMode);

db.exec('PRAGMA foreign_keys = ON');
const fk = db.prepare('PRAGMA foreign_keys').get();
console.log('   foreign_keys:', fk);

console.log('6. Testing transaction...');
db.exec('BEGIN');
try {
  insert.run('dave');
  db.exec('COMMIT');
  console.log('   transaction committed');
} catch (e) {
  db.exec('ROLLBACK');
  console.log('   transaction rolled back:', e.message);
}

console.log('7. Testing file-based DB...');
const fs = require('fs');
const path = require('path');
const tmpDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
const dbPath = path.join(tmpDir, 'test_node_sqlite.db');
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const fileDb = new DatabaseSync(dbPath);
fileDb.exec('CREATE TABLE t (a INT)');
fileDb.prepare('INSERT INTO t VALUES (?)').run(42);
fileDb.close();

const fileDb2 = new DatabaseSync(dbPath);
const val = fileDb2.prepare('SELECT * FROM t').get();
console.log('   file DB value:', val);
fileDb2.close();
fs.unlinkSync(dbPath);

console.log('\n✅ All tests passed!');
