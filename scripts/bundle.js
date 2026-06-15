const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const inDir = path.join(rootDir, 'public', 'js', 'client');
const outFile = path.join(rootDir, 'public', 'app.bundle.js');

const visited = new Set();
const order = [];
const moduleCodes = new Map();

function walk(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) walk(full);
    else if (f.name.endsWith('.js')) addModule(full);
  }
}

function addModule(file) {
  const rel = path.relative(inDir, file).replace(/\\/g, '/');
  if (visited.has(rel)) return;
  visited.add(rel);
  let code = fs.readFileSync(file, 'utf8');

  const imports = [];
  code = code.replace(/^import\s+(.+?)\s+from\s+['"](.+?)['"];?$/gm, function(_, bindings, src) {
    const resolved = resolveImport(rel, src);
    imports.push({ bindings: bindings.trim(), src: src, resolved: resolved });
    if (resolved && !resolved.startsWith('vendor:') && !visited.has(resolved)) {
      addModule(path.join(inDir, resolved));
    }
    return '';
  });

  code = code.replace(/^export\s+/gm, '');
  code = code.replace(/\bexport\s+\{([^}]+)\};?$/gm, '');

  moduleCodes.set(rel, { code: code, imports: imports });
  order.push(rel);
}

function resolveImport(from, src) {
  if (src === 'react' || src === 'react-dom/client') return 'vendor:' + src;
  if (src.startsWith('./') || src.startsWith('../')) {
    const base = path.dirname(from);
    let resolved = path.normalize(path.join(base, src));
    if (!resolved.endsWith('.js')) resolved += '.js';
    return resolved.replace(/\\/g, '/');
  }
  return src;
}

walk(inDir);

const chunks = [];
chunks.push('(function(window) {\n');
chunks.push('  "use strict";\n');
chunks.push('  const React = window.React;\n');
chunks.push('  const ReactDOM = window.ReactDOM;\n');
chunks.push('  const createRoot = ReactDOM.createRoot;\n');

for (const rel of order) {
  const mod = moduleCodes.get(rel);
  if (!mod) continue;

  const varNames = [];
  for (const imp of mod.imports) {
    const b = imp.bindings;
    if (imp.resolved && imp.resolved.startsWith('vendor:')) {
      continue;
    }
    const defaultMatch = b.match(/^(\w+)$/) || b.match(/^(\w+),/);
    const namedMatches = [...b.matchAll(/(\w+)\s+as\s+(\w+)|(?:^|,\s*)(\w+)(?=,|$)/g)];
    if (defaultMatch) varNames.push(defaultMatch[1]);
    for (const m of namedMatches) {
      if (m[2]) varNames.push(m[2]);
      else if (m[3]) varNames.push(m[3]);
    }
  }

  chunks.push('\n  // --- ' + rel + ' ---\n');
  chunks.push(mod.code + '\n');
}

chunks.push('})(window);\n');

const finalCode = chunks.join('');
fs.writeFileSync(outFile, finalCode, 'utf8');
console.log('✓ Bundle written:', outFile, (finalCode.length / 1024).toFixed(1), 'KB');
