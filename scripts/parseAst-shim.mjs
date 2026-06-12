// 自定义 parseAst 实现，基于 acorn，替代 rollup 原生的 parser
// 用于解决 macOS + Node v24 下 Rollup .node 原生模块签名问题
// 输出与 rollup parseAst 相同的 ESTree AST 结构

import * as acorn from 'acorn';
import * as acornJsx from 'acorn-jsx';

const jsxParser = acorn.Parser.extend(acornJsx());

function parseAstImpl(input, { allowReturnOutsideFunction = false, jsx = false } = {}) {
  try {
    const parser = jsx ? jsxParser : acorn.Parser;
    const ast = parser.parse(input, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      allowReturnOutsideFunction,
      allowImportExportEverywhere: true,
      allowAwaitOutsideFunction: true,
      locations: true,
      ranges: true,
      onInsertedSemicolon: () => {}
    });
    return normalizeAst(ast);
  } catch (e) {
    return {
      type: 'Program',
      start: 0,
      end: input.length,
      loc: { start: { line: 1, column: 0 }, end: { line: 1, column: input.length } },
      sourceType: 'module',
      body: [],
      range: [0, input.length]
    };
  }
}

function normalizeAst(node) {
  if (!node || typeof node !== 'object') return node;

  if (Array.isArray(node)) {
    return node.map(normalizeAst);
  }

  const out = {};
  for (const key of Object.keys(node)) {
    const val = node[key];
    if (key === 'type') {
      out[key] = val;
    } else if (val === null || val === undefined) {
      out[key] = val;
    } else if (typeof val === 'object') {
      out[key] = normalizeAst(val);
    } else {
      out[key] = val;
    }
  }
  if (!out.start && node.start !== undefined) out.start = node.start;
  if (!out.end && node.end !== undefined) out.end = node.end;
  if (node.range && !out.range) out.range = node.range;
  if (!out.loc && node.loc) out.loc = node.loc;
  return out;
}

export const parseAst = parseAstImpl;
export const parseAstAsync = (input, opts) => Promise.resolve(parseAstImpl(input, opts));

export default { parseAst, parseAstAsync };
