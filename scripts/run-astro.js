#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { getNodeExecutable } from './ensure-node.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

function main() {
  const nodePath = getNodeExecutable();
  const args = process.argv.slice(2);
  const astroPath = resolve(projectRoot, 'node_modules/astro/astro.js');
  
  const child = spawn(nodePath, [astroPath, ...args], {
    stdio: 'inherit',
    cwd: projectRoot,
    env: { ...process.env }
  });
  
  child.on('exit', (code) => {
    process.exit(code);
  });
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
