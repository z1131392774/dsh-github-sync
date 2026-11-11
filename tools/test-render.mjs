// 渲染测试：不需要浏览器，用假 React 跑一遍面板，检查宽窄两态的布局契约。
// 覆盖：窄屏整页滚动（根容器滚动、列表不再内部滚动、动作条吸底）、
//       设置抽屉在窄屏贴底可滚 / 宽屏右上角 340 宽、页签切换只影响对应一栏。

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.resolve(here, '..', 'client.js'), 'utf8');
const now = Date.now();

let pass = 0;
const fails = [];
const ok = (name, cond, extra) => {
  if (cond) { pass += 1; return; }
  fails.push(name + (extra ? ' — ' + extra : ''));
};

const DATA = {
  '/dsh-github-sync/status': {
    ok: true, version: '0.5.1', device: { id: 'd1', name: 'dev' },
    repo: 'owner/repo', branch: 'main', hasToken: true,
    cwd: '/work', defaultCwd: '/work', enableFiles: true, skipPreview: false, connected: true,
  },
  '/dsh-github-sync/sessions': {
    ok: true,
    sessions: [
      { id: 'session-aaaa1111', title: '本地这条', bytes: 4096, mtimeMs: now - 60000, sync: 'synced' },
      { id: 'session-bbbb2222', title: '', bytes: 120, mtimeMs: now - 60000, sync: 'not-uploaded', origin: 'subagent' },
    ],
  },
  '/dsh-github-sync/workspaces': {
    ok: true,
    workspaces: [{ id: 'w1', path: '/work', title: 'work', sessionCount: 2 }],
  },
  '/dsh-github-sync/devices': { ok: true, devices: [] },
  '/dsh-github-sync/history': { ok: true, history: [] },
  '/dsh-github-sync/remote': {
    ok: true, projects: { work: { sessions: 1 } },
    sessions: [{ id: 'session-cccc3333', title: '远端这条', bytes: 8192, project: 'work' }],
    files: [],
  },
  '/dsh-github-sync/transfers': { ok: true, transfers: [] },
};

let captured = null;
const styleEls = [];
const store = new Map();
const localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
};
const document = {
  baseURI: 'http://127.0.0.1:3080/',
  head: { appendChild: (el) => styleEls.push(el) },
  documentElement: { appendChild: (el) => styleEls.push(el) },
  getElementById: (id) => styleEls.find((e) => e.id === id) || null,
  createElement: (tag) => ({ tag, id: '', textContent: '' }),
};

let hookIndex = 0;
const hookValues = [];
const React = {
  useState(init) {
    const i = hookIndex++;
    if (!(i in hookValues)) hookValues[i] = typeof init === 'function' ? init() : init;
    return [hookValues[i], (v) => { hookValues[i] = typeof v === 'function' ? v(hookValues[i]) : v; }];
  },
  useEffect(fn) { try { fn(); } catch { /* 副作用在测试里可忽略 */ } },
  useMemo(fn) { return fn(); },
  useCallback(fn) { return fn; },
  useRef(v) { return { current: v }; },
  createElement(type, props, ...children) { return { type, props: props || {}, children: children.flat() }; },
};

function flatten(node, out = []) {
  if (node == null || typeof node !== 'object') return out;
  if (Array.isArray(node)) { node.forEach((c) => flatten(c, out)); return out; }
  if (typeof node.type === 'function') flatten(node.type({ ...(node.props || {}), children: node.children }), out);
  out.push(node);
  flatten(node.children, out);
  return out;
}
const textOf = (node) => {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(' ');
  return textOf(node.children);
};

globalThis.window = {
  __ModuleLoader__: { load: (m) => { captured = m; } },
  localStorage,
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
};
globalThis.document = document;
globalThis.localStorage = localStorage;
try {
  Object.defineProperty(globalThis, 'navigator', { value: { clipboard: { writeText: async () => {} } }, configurable: true });
} catch { /* 已有 navigator 就跳过 */ }
globalThis.fetch = async (url) => {
  const p = String(url).replace(/^https?:\/\/[^/]+/, '').split('?')[0];
  return { ok: true, status: 200, json: async () => (DATA[p] ?? { ok: false, error: 'not stubbed: ' + p }) };
};
globalThis.setTimeout = () => 0;
globalThis.clearTimeout = () => {};
globalThis.setInterval = () => 0;
globalThis.clearInterval = () => {};

vm.runInThisContext(source, { filename: 'client.js' });
const plugin = captured.factory((name) => (name === 'react' ? React : {}));
let Panel = null;
plugin.apply({
  effect() {},
  locale: { register() {}, bind: () => (k) => k },
  slots: {
    inject(_slot, fn) { fn(); return () => {}; },
    register(spec, comp) { if (spec.key === 'dsh-github-sync') Panel = comp; return () => {}; },
  },
  credentials: { set() {}, resolve() {}, unset() {} },
});
if (!Panel) throw new Error('面板没有注册到 main 槽');

const tick = () => new Promise((r) => setImmediate(r));
const render = async () => {
  let tree = Panel({ t: (k) => k });
  for (let i = 0; i < 6; i += 1) { await tick(); hookIndex = 0; tree = Panel({ t: (k) => k }); }
  return tree;
};

for (const narrow of [false, true]) {
  hookIndex = 0;
  hookValues.length = 0;
  store.clear();
  globalThis.window.matchMedia = () => ({ matches: narrow, addEventListener() {}, removeEventListener() {} });

  let tree = await render();
  const nodes = flatten(tree);
  const texts = textOf(tree);
  const styled = nodes.map((n) => n.props && n.props.style).filter(Boolean);
  const rootStyle = tree.props.style;
  const innerLists = styled.filter((s) => s.overflow === 'auto').length;
  const stickyBottom = styled.filter((s) => s.position === 'sticky' && s.bottom === 0).length;
  const tag = narrow ? '窄屏' : '宽屏';

  ok(tag + ' 根容器声明了滚动策略', typeof rootStyle.overflowY === 'string', JSON.stringify(rootStyle.overflowY));
  ok(tag + ' 渲染出本机会话标题', texts.includes('本地这条'));
  ok(tag + ' 渲染出浏览工作区', texts.includes('浏览工作区'));

  if (narrow) {
    ok('窄屏整页滚动', rootStyle.overflowY === 'auto', JSON.stringify(rootStyle.overflowY));
    ok('窄屏列表不再内部滚动', innerLists === 0, '实际 ' + innerLists);
    ok('窄屏动作条吸底', stickyBottom >= 1, '实际 ' + stickyBottom);
    ok('窄屏出现页签开关', texts.includes('本机 ·') && texts.includes('仓库 ·'));
    ok('窄屏首屏只有本机会话', !texts.includes('远端这条'));
  } else {
    ok('宽屏两栏各自滚动', innerLists === 2, '实际 ' + innerLists);
    ok('宽屏有下载到下拉', texts.includes('下载到'));
    ok('宽屏两个主操作都在', texts.includes('上传到仓库') && texts.includes('下载到本机'));
  }

  // 设置抽屉：点开它，检查落位
  const gear = nodes.find((n) => n.type === 'button' && String(n.props?.children?.[0] ?? n.children?.[0] ?? '').includes('⚙'));
  ok(tag + ' 找得到设置按钮', Boolean(gear));
  if (gear) {
    gear.props.onClick();
    hookIndex = 0;
    tree = Panel({ t: (k) => k });
    const drawer = flatten(tree).find((n) => n.props?.style && n.props.style.background === 'Canvas'
      && (n.props.style.position === 'fixed' || n.props.style.position === 'absolute'));
    ok(tag + ' 设置抽屉打开', Boolean(drawer));
    if (drawer) {
      const st = drawer.props.style;
      ok(tag + ' 设置里有 token 输入框', flatten(drawer).some((n) => n.type === 'input' && n.props.type === 'password'));
      if (narrow) {
        ok('窄屏设置抽屉贴底', st.position === 'fixed' && st.bottom === 8, JSON.stringify([st.position, st.bottom]));
        ok('窄屏设置抽屉可滚', st.overflowY === 'auto' && st.maxHeight === 'calc(100vh - 16px)');
      } else {
        ok('宽屏设置抽屉右上角', st.position === 'absolute' && st.width === 340, JSON.stringify([st.position, st.width]));
      }
    }
  }
}

if (fails.length) {
  console.error('FAIL ' + fails.length + ' 条：');
  for (const f of fails) console.error('  x ' + f);
  process.exit(1);
}
console.log('通过 ' + pass + ' · 失败 0（面板渲染：宽窄两态 + 设置抽屉）');
