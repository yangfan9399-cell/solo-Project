import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, '..')

const rollupNativeJs = path.join(rootDir, 'node_modules', 'rollup', 'dist', 'native.js')
const rollupNativeBindingDir = path.join(rootDir, 'node_modules', '@rollup')

const fallbackCode = "const { existsSync } = require('node:fs');\n" +
"const path = require('node:path');\n" +
"const { platform, arch, report } = require('node:process');\n" +
"const { spawnSync } = require('node:child_process');\n" +
"\n" +
"const getReportHeader = () => {\n" +
"	try {\n" +
"		if (platform !== 'win32') {\n" +
"			const previousExcludeNetwork = report.excludeNetwork;\n" +
"			report.excludeNetwork = true;\n" +
"			const header = report.getReport().header;\n" +
"			report.excludeNetwork = previousExcludeNetwork;\n" +
"			return header;\n" +
"		}\n" +
"		const script = \"const r=require('node:process').report;r.excludeNetwork=true;console.log(JSON.stringify(r.getReport().header));\";\n" +
"		const child = spawnSync(process.execPath, ['-p', script], { encoding: 'utf8', timeout: 3000, windowsHide: true });\n" +
"		if (child.status !== 0) return null;\n" +
"		const stdout = child.stdout && child.stdout.replace(/undefined\\r?\\n?$/, '').trim();\n" +
"		return stdout ? JSON.parse(stdout) : null;\n" +
"	} catch { return null; }\n" +
"};\n" +
"\n" +
"let reportHeader;\n" +
"const isMingw32 = () => { reportHeader = reportHeader || getReportHeader(); return (reportHeader && reportHeader.osName && reportHeader.osName.startsWith('MINGW32_NT')) || false; };\n" +
"const isMusl = () => { reportHeader = reportHeader || getReportHeader(); return reportHeader ? !reportHeader.glibcVersionRuntime : false; };\n" +
"\n" +
"const bindingsByPlatformAndArch = {\n" +
"	android: { arm: { base: 'android-arm-eabi' }, arm64: { base: 'android-arm64' } },\n" +
"	darwin: { arm64: { base: 'darwin-arm64' }, x64: { base: 'darwin-x64' } },\n" +
"	freebsd: { arm64: { base: 'freebsd-arm64' }, x64: { base: 'freebsd-x64' } },\n" +
"	linux: { arm: { base: 'linux-arm-gnueabihf', musl: 'linux-arm-musleabihf' }, arm64: { base: 'linux-arm64-gnu', musl: 'linux-arm64-musl' }, loong64: { base: 'linux-loong64-gnu', musl: 'linux-loong64-musl' }, ppc64: { base: 'linux-ppc64-gnu', musl: 'linux-ppc64-musl' }, riscv64: { base: 'linux-riscv64-gnu', musl: 'linux-riscv64-musl' }, s390x: { base: 'linux-s390x-gnu', musl: null }, x64: { base: 'linux-x64-gnu', musl: 'linux-x64-musl' } },\n" +
"	openbsd: { x64: { base: 'openbsd-x64' } },\n" +
"	openharmony: { arm64: { base: 'openharmony-arm64' } },\n" +
"	win32: { arm64: { base: 'win32-arm64-msvc' }, ia32: { base: 'win32-ia32-msvc' }, x64: { base: 'win32-x64-msvc' } }\n" +
"};\n" +
"\n" +
"function getPackageBase() {\n" +
"	const imported = bindingsByPlatformAndArch[platform] && bindingsByPlatformAndArch[platform][arch];\n" +
"	if (!imported) return null;\n" +
"	if ('musl' in imported && isMusl()) return imported.musl || null;\n" +
"	return imported.base;\n" +
"}\n" +
"\n" +
"let nativeModule = null;\n" +
"const packageBase = getPackageBase();\n" +
"\n" +
"function xxhashSimple(data, base) {\n" +
"	let hash = 2166136261;\n" +
"	const str = typeof data === 'string' ? data : Buffer.from(data).toString();\n" +
"	for (let i = 0; i < str.length; i++) {\n" +
"		hash ^= str.charCodeAt(i);\n" +
"		hash = Math.imul(hash, 16777619);\n" +
"	}\n" +
"	const u = (hash >>> 0);\n" +
"	if (base === 16) return u.toString(16);\n" +
"	if (base === 36) return u.toString(36);\n" +
"	return Buffer.from(u.toString(36)).toString('base64url');\n" +
"}\n" +
"\n" +
"const jsParse = (() => {\n" +
"	try {\n" +
"		const p = require.resolve('rollup/package.json');\n" +
"		const parseMod = require(path.join(path.dirname(p), 'dist', 'shared', 'parseAst.js'));\n" +
"		if (parseMod && parseMod.parseAst && typeof parseMod.parseAst === 'function') return parseMod.parseAst;\n" +
"	} catch (e) {}\n" +
"	return null;\n" +
"})();\n" +
"\n" +
"const jsParseAsync = (() => {\n" +
"	try {\n" +
"		const p = require.resolve('rollup/package.json');\n" +
"		const parseMod = require(path.join(path.dirname(p), 'dist', 'shared', 'parseAst.js'));\n" +
"		if (parseMod && parseMod.parseAstAsync && typeof parseMod.parseAstAsync === 'function') return parseMod.parseAstAsync;\n" +
"	} catch (e) {}\n" +
"	return null;\n" +
"})();\n" +
"\n" +
"if (packageBase) {\n" +
"	const localName = './rollup.' + packageBase + '.node';\n" +
"	try {\n" +
"		const localPath = path.join(__dirname, localName);\n" +
"		if (existsSync(localPath)) { try { nativeModule = require(localPath); } catch (e) {} }\n" +
"		if (!nativeModule) { try { nativeModule = require('@rollup/rollup-' + packageBase); } catch (e) {} }\n" +
"	} catch (e) {}\n" +
"}\n" +
"\n" +
"if (!nativeModule && jsParse) {\n" +
"	nativeModule = {\n" +
"		parse: jsParse,\n" +
"		parseAsync: jsParseAsync || (async function(source, options) { return jsParse(source, options); }),\n" +
"		xxhashBase64Url: function(data) { return xxhashSimple(data, 64); },\n" +
"		xxhashBase36: function(data) { return xxhashSimple(data, 36); },\n" +
"		xxhashBase16: function(data) { return xxhashSimple(data, 16); },\n" +
"	};\n" +
"}\n" +
"\n" +
"if (!nativeModule) {\n" +
"	nativeModule = {\n" +
"		parse: function() { throw new Error('Rollup parser unavailable'); },\n" +
"		parseAsync: async function() { throw new Error('Rollup parser unavailable'); },\n" +
"		xxhashBase64Url: function(data) { return xxhashSimple(data, 64); },\n" +
"		xxhashBase36: function(data) { return xxhashSimple(data, 36); },\n" +
"		xxhashBase16: function(data) { return xxhashSimple(data, 16); },\n" +
"};\n" +
"	console.warn('[rollup-fallback] Using minimal Rollup fallback. Some features may be limited.');\n" +
"}\n" +
"\n" +
"module.exports.parse = nativeModule.parse;\n" +
"module.exports.parseAsync = nativeModule.parseAsync;\n" +
"module.exports.xxhashBase64Url = nativeModule.xxhashBase64Url;\n" +
"module.exports.xxhashBase36 = nativeModule.xxhashBase36;\n" +
"module.exports.xxhashBase16 = nativeModule.xxhashBase16;\n"

function tryFixSignature() {
	if (process.platform !== 'darwin') return false
	try {
		const dirs = fs.readdirSync(rollupNativeBindingDir)
		for (const dir of dirs) {
			if (dir.startsWith('rollup-') && dir.includes('darwin')) {
				const fullDir = path.join(rollupNativeBindingDir, dir)
				const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.node'))
				for (const f of files) {
					const fullPath = path.join(fullDir, f)
					try {
						execSync('codesign --remove-signature "' + fullPath + '" 2>/dev/null; codesign --force --deep -s - "' + fullPath + '" 2>/dev/null', { stdio: 'ignore' })
						console.log('Fixed signature: ' + f)
					} catch (e) {}
				}
			}
		}
		return true
	} catch (e) {
		return false
	}
}

if (!fs.existsSync(rollupNativeJs)) {
	console.log('rollup native.js not found, skipping fix')
	process.exit(0)
}

const originalContent = fs.readFileSync(rollupNativeJs, 'utf-8')
if (originalContent.includes('rollup-fallback') || originalContent.includes('xxhashSimple')) {
	console.log('Rollup already patched')
} else {
	tryFixSignature()

	let testRequireOk = false
	try {
		const testPath = rollupNativeJs
		delete require.cache[require.resolve(testPath)]
		require(testPath)
		testRequireOk = true
	} catch (e) {}

	if (!testRequireOk) {
		fs.writeFileSync(rollupNativeJs, fallbackCode, 'utf-8')
		console.log('Rollup patched with JS fallback')
	} else {
		console.log('Rollup native binding works correctly')
	}
}

const dataDb = path.join(rootDir, 'data', 'db.json')
if (!fs.existsSync(dataDb)) {
	console.log('Database not initialized, running init-db...')
	try {
		execSync('node "' + path.join(__dirname, 'init-db.mjs') + '"', { stdio: 'inherit' })
	} catch (e) {}
}
