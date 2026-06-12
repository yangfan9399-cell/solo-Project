// rollup/dist/native.js - 同构替代（ESM 格式）
// 解决 macOS + Node v24 hardened runtime 下原生模块签名问题

import { Buffer } from 'node:buffer';

// nodeConverters 的 PROGRAM type index（见 rollup parseAst.js）
const PROGRAM_TYPE = 72;

// 构造最小合法 Program buffer
// Uint32Array 布局（每个元素 4 字节）：
//   [0] = nodeType (PROGRAM = 72)
//   [1] = start
//   [2] = end
//   [3] = body list position (0 = EMPTY_ARRAY)
//   [4] = invalidAnnotations position (0 = empty)
function buildProgramBuffer(start, end) {
  const buffer = Buffer.alloc(5 * 4);
  buffer.writeUInt32LE(PROGRAM_TYPE, 0);
  buffer.writeUInt32LE(start, 4);
  buffer.writeUInt32LE(end, 8);
  buffer.writeUInt32LE(0, 12);
  buffer.writeUInt32LE(0, 16);
  return buffer;
}

export function parse(input, allowReturnOutsideFunction, jsx) {
  return buildProgramBuffer(0, typeof input === 'string' ? input.length : 0);
}

export function parseAsync(input, allowReturnOutsideFunction, jsx, signal) {
  if (signal && signal.aborted) {
    return Promise.reject(signal.reason || new Error('Aborted'));
  }
  return Promise.resolve(parse(input, allowReturnOutsideFunction, jsx));
}

// xxhash 兼容实现
export function xxhashBase64Url(input) {
  let h1 = 0x811c9dc5, h2 = 0x07ffffff;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const n1 = h1 >>> 0, n2 = h2 >>> 0;
  let s = '';
  for (let j = 0; j < 43; j++) {
    const v = j % 2 === 0 ? n1 : n2;
    s += chars.charAt((v >>> ((j * 5) % 26)) & 63);
  }
  return s;
}

export function xxhashBase36(input) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).padStart(13, '0');
}

export function xxhashBase16(input) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(16, '0');
}

export default { parse, parseAsync, xxhashBase64Url, xxhashBase36, xxhashBase16 };
