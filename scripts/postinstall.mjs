import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

if (!existsSync(join(dataDir, 'players.json'))) {
  writeFileSync(join(dataDir, 'players.json'), JSON.stringify([
    {
      id: 'player-1',
      name: '研究员',
      completedLevels: [],
      bestScores: {},
      createdAt: Date.now()
    }
  ], null, 2));
}

if (!existsSync(join(dataDir, 'sessions.json'))) {
  writeFileSync(join(dataDir, 'sessions.json'), '[]');
}

try {
  const nodeFile = join(process.cwd(), 'node_modules/@rollup/rollup-darwin-arm64/rollup.darwin-arm64.node');
  if (existsSync(nodeFile)) {
    execSync(`codesign --force --sign - "${nodeFile}"`, { stdio: 'ignore' });
  }
} catch {}
