/**
 * 本地跑调音器自检（不需要真机 / 模拟器 / 构建）
 *
 * 用法：
 *   node scripts/dev/run-selftest-node.mjs
 *   node scripts/dev/run-selftest-node.mjs --json        # 额外打印原始 JSON
 *
 * 原理：项目里的自检模块是纯 TS（无 React Native 依赖），
 * 这里用本仓库已装的 typescript 把它即时转成 CommonJS 并加载，
 * 从而不必引入 jest/ts-node 之类的额外依赖。
 * 退出码：0 = 全部用例通过，1 = 有用例失败。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ts = require('typescript');

const moduleCache = new Map();

function resolveTs(spec, fromDir) {
  const base = path.resolve(fromDir, spec);
  const candidates = [
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function loadTsFile(absPath) {
  const abs = path.resolve(absPath);
  const cached = moduleCache.get(abs);
  if (cached) return cached.exports;

  const source = fs.readFileSync(abs, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    fileName: abs,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });

  const mod = { exports: {} };
  moduleCache.set(abs, mod);

  const dir = path.dirname(abs);
  const localRequire = (spec) => {
    if (!spec.startsWith('.')) {
      throw new Error(
        `模块 "${spec}"（来自 ${path.relative(ROOT, abs)}）是非相对路径导入，本地跑自检时不可用。`
      );
    }
    const resolved = resolveTs(spec, dir);
    if (!resolved) throw new Error(`无法解析 "${spec}"（来自 ${path.relative(ROOT, abs)}）`);
    return loadTsFile(resolved);
  };

  const fn = new Function(
    'exports',
    'require',
    'module',
    '__filename',
    '__dirname',
    outputText
  );
  fn(mod.exports, localRequire, mod, abs, dir);
  return mod.exports;
}

const entry = path.join(ROOT, 'src/dev/tunerSelfTest.ts');
if (!fs.existsSync(entry)) {
  console.error(`找不到自检模块：${entry}`);
  process.exit(2);
}

const { runSelfTest, formatReport, buildSummary, SELFTEST_RESULT_PREFIX, SELFTEST_SUMMARY_PREFIX } =
  loadTsFile(entry);

const report = runSelfTest();
console.log(formatReport(report));
console.log('\n' + SELFTEST_SUMMARY_PREFIX + JSON.stringify(buildSummary(report)));

if (process.argv.includes('--json')) {
  console.log('\n' + SELFTEST_RESULT_PREFIX + JSON.stringify(report, null, 2));
}

process.exit(report.pass ? 0 : 1);
