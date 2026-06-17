import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { platform } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const IS_MACOS = platform() === 'darwin'
const NM = join(ROOT, 'node_modules')

function tryCodesignAll() {
  if (!IS_MACOS) return
  try {
    const find = `find "${NM}" -name "*.node" -type f 2>/dev/null | head -120`
    const files = execSync(find, { shell: true, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
    let ok = 0, fail = 0
    for (const f of files) {
      try {
        execSync(`xattr -cr "${f}" 2>/dev/null; codesign --force --deep --sign - "${f}" 2>/dev/null`, { shell: true, stdio: 'ignore' })
        ok++
      } catch (_) { fail++ }
    }
    if (ok > 0) {
      process.stderr.write(`[postinstall] 已重新签名 ${ok} 个原生模块${fail > 0 ? `（失败 ${fail}` : ''}\n`)
    }
  } catch (e) {
    process.stderr.write(`[postinstall] codesign 跳过: ${e.message}\n`)
  }
}

function runPrepare() {
  const nuxtBin = join(NM, 'nuxt', 'bin', 'nuxt.mjs')
  if (!existsSync(nuxtBin)) {
    process.stderr.write('[postinstall] node_modules 未就绪，跳过 prepare。\n')
    return
  }
  try {
    execSync(`node "${resolve(__dirname, 'bootstrap.mjs')}" nuxt prepare`, {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, NAPI_RS_FORCE_WASI: '1' }
    })
  } catch (e) {
    process.stderr.write(`[postinstall] prepare 跳过（非致命，可稍后手动执行 npm run prepare）: ${e.message}\n`)
  }
}

tryCodesignAll()
runPrepare()
