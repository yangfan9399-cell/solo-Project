import { pathToFileURL, fileURLToPath } from 'node:url';
import { isBuiltin } from 'node:module';
import { dirname, join, resolve as pathResolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let shimPath = null;

try {
  shimPath = pathToFileURL(pathResolve(__dirname, 'rollup-native-shim.mjs')).href;
  console.log('[rollup-esm-loader] Shim path:', shimPath);
} catch (e) {
  console.warn('[rollup-esm-loader] Cannot resolve shim:', e.message);
}

const ROLLUP_REDIRECT_PATTERNS = [
  /rollup\/dist\/native\.js$/,
  /rollup\/dist\/native$/,
  /@rollup\/rollup-[a-z0-9-]+\/.*\.node$/,
  /@rollup\/rollup-[a-z0-9-]+$/
];

function shouldRedirect(url) {
  if (!url || !shimPath) return false;
  const normalized = url.replace(/\\/g, '/');
  for (const pattern of ROLLUP_REDIRECT_PATTERNS) {
    if (pattern.test(normalized)) return true;
  }
  return false;
}

export function resolve(specifier, context, nextResolve) {
  const { parentURL = null } = context;

  if (isBuiltin(specifier)) {
    return nextResolve(specifier, context);
  }

  try {
    const resolved = nextResolve(specifier, context);
    
    if (resolved && resolved.url && shouldRedirect(resolved.url)) {
      console.log(`[rollup-esm-loader] Redirecting ESM: ${resolved.url}`);
      return {
        ...resolved,
        url: shimPath,
        format: 'module',
        shortCircuit: true
      };
    }
    
    return resolved;
  } catch (e) {
    if (shouldRedirect(specifier)) {
      console.log(`[rollup-esm-loader] Redirecting ESM (catch): ${specifier}`);
      return {
        url: shimPath,
        format: 'module',
        shortCircuit: true
      };
    }
    throw e;
  }
}

export function load(url, context, nextLoad) {
  if (shouldRedirect(url)) {
    console.log(`[rollup-esm-loader] Loading shim for: ${url}`);
    return nextLoad(shimPath, { ...context, format: 'module' });
  }
  return nextLoad(url, context);
}

console.log('[rollup-esm-loader] Installed successfully');
