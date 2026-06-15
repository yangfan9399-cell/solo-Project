/**
 * Post-install script: replaces rollup's native bindings loader with a pure-JS fallback.
 * This is needed because on some macOS Node.js builds (e.g. bundled Node in IDEs),
 * Rollup's native .node modules fail library validation / code signing checks.
 *
 * The fallback uses acorn + acorn-jsx for parsing and Node's crypto for hashing,
 * which is slower but always works.
 */

const fs = require('fs');
const path = require('path');

const ROLLUP_NATIVE_PATH = path.join(
  __dirname, '..', 'node_modules', 'rollup', 'dist', 'native.js'
);

const REPLACEMENT_CONTENT = `// Patched by project postinstall: pure-JS fallback for rollup native bindings
// Reason: native .node modules fail library validation on this Node.js build
const { existsSync } = require('node:fs');
const path = require('node:path');
const { platform, arch, report } = require('node:process');
const { spawnSync } = require('node:child_process');
const { Parser: AcornParser } = require('acorn');
const acornJsx = require('acorn-jsx');
const { createHash } = require('node:crypto');

const JsxEmitterParser = AcornParser.extend(acornJsx());

function parseWithAcorn(input, allowReturnOutsideFunction, jsx) {
  const Parser = jsx ? JsxEmitterParser : AcornParser;
  const ast = Parser.parse(input, {
    ecmaVersion: 'latest',
    sourceType: 'module',
    allowReturnOutsideFunction,
    allowHashBang: true,
    allowImportExportEverywhere: true,
    allowAwaitOutsideFunction: true,
    allowSuperOutsideMethod: true
  });
  normalizeAst(ast);
  return ast;
}

const ARRAY_PROPS = new Set([
  'decorators', 'body', 'params', 'arguments', 'elements',
  'properties', 'specifiers', 'cases', 'consequent', 'alternate',
  'statements', 'expressions', 'quasis', 'children'
]);

function normalizeAst(node) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const child of node) normalizeAst(child);
    return;
  }
  if (node.type) {
    for (const key of ARRAY_PROPS) {
      if (node[key] === undefined) node[key] = [];
    }
    for (const key of Object.keys(node)) {
      const value = node[key];
      if (value === undefined && !ARRAY_PROPS.has(key)) {
        node[key] = null;
      } else if (Array.isArray(value)) {
        for (const child of value) normalizeAst(child);
      } else if (value && typeof value === 'object' && value.type) {
        normalizeAst(value);
      } else if (value && typeof value === 'object') {
        normalizeAst(value);
      }
    }
  }
}

const BASE64URL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const BASE36_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';
const BASE16_CHARS = '0123456789abcdef';

function hashToBase(input, baseChars) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const hash = createHash('sha256').update(buf).digest();
  let result = '';
  const mask = baseChars.length - 1;
  for (let i = 0; i < 8; i++) {
    result += baseChars[hash[i] & mask];
  }
  return result;
}

const getReportHeader = () => {
  try {
    if (platform !== 'win32') {
      const previousExcludeNetwork = report.excludeNetwork;
      report.excludeNetwork = true;
      const header = report.getReport().header;
      report.excludeNetwork = previousExcludeNetwork;
      return header;
    }
    const script =
      "const r=require('node:process').report;r.excludeNetwork=true;console.log(JSON.stringify(r.getReport().header));";
    const child = spawnSync(process.execPath, ['-p', script], {
      encoding: 'utf8', timeout: 3000, windowsHide: true
    });
    if (child.status !== 0) return null;
    const stdout = child.stdout?.replace(/undefined\\r?\\n?$/, '').trim();
    return stdout ? JSON.parse(stdout) : null;
  } catch {
    return null;
  }
};

let reportHeader;
const isMingw32 = () => {
  reportHeader ??= getReportHeader();
  return reportHeader?.osName?.startsWith('MINGW32_NT') ?? false;
};
const isMusl = () => {
  reportHeader ??= getReportHeader();
  return reportHeader ? !reportHeader.glibcVersionRuntime : false;
};

// Native bindings: always fail gracefully (use JS fallback instead)
function loadNative() {
  return null;
}

module.exports.parse = function parse(input, allowReturnOutsideFunction = false, jsx = false) {
  return parseWithAcorn(input, allowReturnOutsideFunction, jsx);
};

module.exports.parseAsync = async function parseAsync(input, allowReturnOutsideFunction = false, jsx = false) {
  return parseWithAcorn(input, allowReturnOutsideFunction, jsx);
};

module.exports.xxhashBase64Url = function xxhashBase64Url(input) {
  return hashToBase(input, BASE64URL_CHARS);
};

module.exports.xxhashBase36 = function xxhashBase36(input) {
  return hashToBase(input, BASE36_CHARS);
};

module.exports.xxhashBase16 = function xxhashBase16(input) {
  return hashToBase(input, BASE16_CHARS);
};
`;

function main() {
  if (!fs.existsSync(ROLLUP_NATIVE_PATH)) {
    console.log('[patch-rollup] rollup/dist/native.js not found, skipping patch');
    return;
  }

  const original = fs.readFileSync(ROLLUP_NATIVE_PATH, 'utf8');
  if (original.includes('Patched by project postinstall')) {
    console.log('[patch-rollup] already patched, skipping');
    return;
  }

  const backupPath = ROLLUP_NATIVE_PATH + '.bak';
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(ROLLUP_NATIVE_PATH, backupPath);
  }

  fs.writeFileSync(ROLLUP_NATIVE_PATH, REPLACEMENT_CONTENT, 'utf8');
  console.log('[patch-rollup] applied pure-JS fallback to rollup native bindings');
}

try {
  main();
} catch (e) {
  console.warn('[patch-rollup] patch failed (non-fatal):', e.message);
}
