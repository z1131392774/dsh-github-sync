// 测试夹具：一条可用的会话日志。
// 优先用本机真实会话（SYNC_SAMPLE 指定的文件，或 DSH_HOME 下第一个 session.v4.jsonl.zstd），
// 找不到就现造一条。这样这些测试在别人的机器和 CI 上也能跑，不再写死作者机器上的绝对路径。
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { encodeFrames } from '../lib/zstdframe.mjs';
import { projectKey } from '../lib/projectkey.mjs';

const DEMO_ID = 'session-11111111-1111-4111-8111-111111111111';

/** 造一条结构完整的会话：首帧 header，其余帧是普通事件 */
export function makeSession({ id = DEMO_ID, cwd = '/workspace/demo', title = '夹具会话', turns = 3 } = {}) {
  const frames = [
    `${JSON.stringify({ type: 'session', version: 4, id, cwd, createdAt: 1, updatedAt: 1 })}\n`,
    `${JSON.stringify({ type: 'session/title', data: { title } })}\n`,
  ];
  for (let i = 0; i < turns; i += 1) {
    frames.push(`${JSON.stringify({ type: 'user/message', text: `问题 ${i + 1}` })}\n`);
    frames.push(`${JSON.stringify({ type: 'assistant/message', text: `回答 ${i + 1}` })}\n`);
  }
  return encodeFrames(frames);
}

function findLocalSession() {
  if (process.env.SYNC_SAMPLE) return readFileSync(process.env.SYNC_SAMPLE);
  const root = join(process.env.DSH_HOME || join(tmpdir(), 'no-such-dsh'), 'sessions');
  const home = join(process.env.HOME || process.env.USERPROFILE || '', '.dsh', 'sessions');
  for (const base of [root, home]) {
    const stack = [base];
    while (stack.length) {
      const dir = stack.pop();
      let entries;
      try { entries = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
      for (const entry of entries) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) stack.push(path);
        else if (entry.name === 'session.v4.jsonl.zstd') {
          try { return readFileSync(path); } catch { /* 读不动就跳过 */ }
        }
      }
    }
  }
  return null;
}

/** 一条会话的字节：本机真实会话优先，否则造一条 */
export function sampleSession(options = {}) {
  return findLocalSession() ?? makeSession(options);
}

/**
 * 建一个临时 DSH_HOME，把会话按「cwd → 目录键」的规则放进去。
 * 返回 { home, cwd, id, buffer }，调用方可直接用 listSessionsForCwd(cwd) 扫到它。
 */
export function installFixture({ cwd = '/workspace/demo', id = DEMO_ID, buffer } = {}) {
  const home = mkdtempSync(join(tmpdir(), 'dsh-sync-fixture-'));
  process.env.DSH_HOME = home;
  const buf = buffer ?? makeSession({ cwd, id });
  const dir = join(home, 'sessions', projectKey(cwd), id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'session.v4.jsonl.zstd'), buf);
  return { home, cwd, id, buffer: buf };
}
