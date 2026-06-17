import { spawn, execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir, platform, arch } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const IS_MACOS = platform() === 'darwin'
const IS_WINDOWS = platform() === 'win32'
const NODE_EXE = IS_WINDOWS ? 'node.exe' : 'node'

process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || ''
process.env.NAPI_RS_FORCE_WASI = '1'

function log(...args) {
  if (process.env.DEBUG_BOOTSTRAP) {
    console.error('[bootstrap]', ...args)
  }
}

function tryCodesignFix(nodeModulesPath) {
  if (!IS_MACOS) return false
  try {
    const find = `find "${nodeModulesPath}" -name "*.node" -type f 2>/dev/null | head -80`
    const files = execSync(find, { shell: true, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
    if (files.length === 0) return false
    let fixed = 0
    for (const f of files) {
      try {
        execSync(`xattr -cr "${f}" 2>/dev/null; codesign --force --deep --sign - "${f}" 2>/dev/null`, { shell: true, stdio: 'ignore' })
        fixed++
      } catch (_) {}
    }
    log(`codesign fix: attempted ${fixed}/${files.length} files`)
    return fixed > 0
  } catch (e) {
    log('codesign fix failed:', e.message)
    return false
  }
}

function writeProbeFile() {
  const lines = [
    "import { createRequire } from 'node:module';",
    "const require = createRequire(import.meta.url);",
    "process.env.NAPI_RS_FORCE_WASI = '1';",
    "try { require.resolve('nuxt/package.json'); } catch(e) { process.exit(2); }",
    "try { const r = require('rollup'); if (r && typeof r.rollup === 'function') { process.exit(0); } process.exit(1); } catch(e) { process.exit(3); }"
  ]
  const p = join(ROOT, '.bootstrap-probe.mjs')
  writeFileSync(p, lines.join('\n'))
  return p
}

function testNode(nodePath) {
  if (!nodePath || !existsSync(nodePath)) return false
  let probePath
  try {
    probePath = writeProbeFile()
  } catch (e) {
    log('probe file write failed:', e.message)
    return false
  }
  try {
    execSync(`"${nodePath}" --experimental-vm-modules "${probePath}"`, {
      stdio: 'ignore',
      timeout: 15000,
      cwd: ROOT,
      env: { ...process.env, NAPI_RS_FORCE_WASI: '1' }
    })
    return true
  } catch (e) {
    log(`testNode ${nodePath} failed with exit`, e.status)
    return false
  }
}

function searchSystemNodes() {
  const candidates = []
  if (IS_MACOS) {
    candidates.push(
      '/opt/homebrew/bin/node',
      '/usr/local/bin/node',
      '/opt/local/bin/node',
      '/usr/bin/node'
    )
    try {
      const nvmDir = process.env.NVM_DIR || join(homedir(), '.nvm')
      const nvmVersions = join(nvmDir, 'versions', 'node')
      if (existsSync(nvmVersions)) {
        const dirs = execSync(`ls -1 "${nvmVersions}" 2>/dev/null | sort -rV | head -10`, { shell: true, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
        for (const d of dirs) candidates.push(join(nvmVersions, d, 'bin', 'node'))
      }
    } catch (_) {}
    try {
      const fnmDir = join(homedir(), '.fnm', 'node-versions')
      if (existsSync(fnmDir)) {
        const dirs = execSync(`ls -1 "${fnmDir}" 2>/dev/null | sort -rV | head -10`, { shell: true, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
        for (const d of dirs) candidates.push(join(fnmDir, d, 'installation', 'bin', 'node'))
      }
    } catch (_) {}
    try {
      const voltaDir = join(homedir(), '.volta', 'tools', 'image', 'node')
      if (existsSync(voltaDir)) {
        const dirs = execSync(`ls -1 "${voltaDir}" 2>/dev/null | sort -rV | head -10`, { shell: true, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
        for (const d of dirs) candidates.push(join(voltaDir, d, 'bin', 'node'))
      }
    } catch (_) {}
    try {
      const asdfDir = process.env.ASDF_DIR || join(homedir(), '.asdf', 'installs', 'nodejs')
      if (existsSync(asdfDir)) {
        const dirs = execSync(`ls -1 "${asdfDir}" 2>/dev/null | sort -rV | head -10`, { shell: true, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
        for (const d of dirs) candidates.push(join(asdfDir, d, 'bin', 'node'))
      }
    } catch (_) {}
  } else if (IS_WINDOWS) {
    candidates.push(
      'C:\\Program Files\\nodejs\\node.exe',
      join(homedir(), 'AppData', 'Roaming', 'nvm', 'node.exe')
    )
  } else {
    candidates.push('/usr/bin/node', '/usr/local/bin/node', join(homedir(), '.nvm'))
  }
  return candidates.filter(p => p && existsSync(p))
}

function findBundledNode() {
  const binPath = IS_WINDOWS
    ? join(ROOT, 'node_modules', 'node', 'node.exe')
    : join(ROOT, 'node_modules', 'node', 'bin', 'node')
  return existsSync(binPath) ? binPath : null
}

function findCompatibleNode() {
  const nm = join(ROOT, 'node_modules')
  const current = process.execPath
  log('testing current node:', current)

  if (testNode(current)) {
    log('current node works')
    return current
  }

  log('current node failed, trying codesign fix...')
  tryCodesignFix(nm)
  if (testNode(current)) {
    log('current node works after codesign fix')
    return current
  }

  const systemNodes = searchSystemNodes()
  log('candidate system nodes:', systemNodes)
  for (const np of systemNodes) {
    if (testNode(np)) {
      log('system node works:', np)
      return np
    }
  }

  const bundled = findBundledNode()
  if (bundled) {
    log('testing bundled node:', bundled)
    tryCodesignFix(nm)
    if (testNode(bundled)) {
      log('bundled node works')
      return bundled
    }
  }

  console.error('\n⚠  无法找到可正常加载原生模块的 Node.js 解释器。')
  console.error('   当前 Node 可能启用了 hardened runtime，导致无法加载 rollup/esbuild 的原生绑定。')
  console.error('   请安装标准的 Node.js LTS（https://nodejs.org/）后重试，或执行：')
  console.error('   npm install node@20 --save-dev  # 将作为项目依赖自动下载备用 Node\n')
  process.exit(1)
}

function spawnCommand(nodePath, args) {
  const env = {
    ...process.env,
    NAPI_RS_FORCE_WASI: '1',
    PATH: `${dirname(nodePath)}${IS_WINDOWS ? ';' : ':'}${process.env.PATH || ''}`
  }
  log(`spawning: ${nodePath} ${args.join(' ')}`)
  const child = spawn(nodePath, args, {
    stdio: 'inherit',
    env,
    cwd: ROOT
  })
  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal)
    process.exit(code ?? 0)
  })
  child.on('error', (err) => {
    console.error('启动失败:', err.message)
    process.exit(1)
  })
}

function resolveCli(cliName) {
  const direct = join(ROOT, 'node_modules', '.bin', cliName + (IS_WINDOWS ? '.cmd' : ''))
  if (existsSync(direct)) return direct
  const js = join(ROOT, 'node_modules', 'nuxt', 'bin', 'nuxt.mjs')
  return js
}

const rawArgs = process.argv.slice(2)
if (rawArgs.length === 0) {
  console.error('用法: node scripts/bootstrap.mjs <command> [args...]')
  console.error('  例: node scripts/bootstrap.mjs nuxi dev')
  console.error('      node scripts/bootstrap.mjs nuxt prepare')
  process.exit(2)
}

const cmd = rawArgs[0]
const rest = rawArgs.slice(1)

const node = findCompatibleNode()
let target
if (cmd === 'nuxi' || cmd === 'nuxt') {
  const cli = resolveCli(cmd)
  target = [cli, ...rest]
} else if (cmd === 'npm' || cmd === 'npx') {
  target = [
    join(dirname(process.execPath), '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    ...(cmd === 'npx' ? ['exec', '--'] : []),
    ...rest
  ]
  if (!existsSync(target[0])) {
    target = [require.resolve('npm/bin/npm-cli.js'), ...(cmd === 'npx' ? ['exec', '--'] : []), ...rest]
  }
} else if (cmd.endsWith('.js') || cmd.endsWith('.mjs') || cmd.endsWith('.cjs') || cmd.endsWith('.ts')) {
  target = [resolve(ROOT, cmd), ...rest]
} else {
  target = [cmd, ...rest]
}

spawnCommand(node, target)
