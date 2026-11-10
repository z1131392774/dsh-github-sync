// 内核自测：不联网，只用真实会话文件与构造数据。
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { projectKey, encodeSegment, decodeSegment } from '../lib/projectkey.mjs';
import { readHeader, readTitle, validateSession, rewriteSession, compareSessions, sha256 } from '../lib/sessionlog.mjs';
import { walkFrames, encodeOne as encodeFrame, encodeFrames } from '../lib/zstdframe.mjs';
import { parseRepo } from '../lib/github.mjs';
import { createManifest, registerWorkspace, upsertSession, sessionPath, serializeManifest, parseManifest, renderReadme } from '../lib/manifest.mjs';

let pass = 0, fail = 0;
function eq(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       期望 ${JSON.stringify(expected)}\n       实际 ${JSON.stringify(actual)}`); }
}
function ok(name, cond) { cond ? (pass++, console.log(`  ok   ${name}`)) : (fail++, console.log(`  FAIL ${name}`)); }

// 夹具：优先用本机真实会话（DSH_SYNC_FIXTURE 或 ~/.dsh 下第一个），没有就现造一条。
// 原来这里写死作者机器上的绝对路径，换台机器、换台 CI 就跑不起来。
function findFixture() {
  if (process.env.DSH_SYNC_FIXTURE) return process.env.DSH_SYNC_FIXTURE;
  const root = join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'sessions');
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) stack.push(path);
      else if (entry.name === 'session.v4.jsonl.zstd') return path;
    }
  }
  return null;
}

function buildFixture() {
  const header = { version: 4, id: 'session-00000000-0000-4000-8000-000000000000', cwd: '/workspace/demo', title: '演示会话', createdAt: 1 };
  return encodeFrames([
    `${JSON.stringify(header)}\n`,
    `${JSON.stringify({ type: 'user/message', text: 'hello' })}\n`,
    `${JSON.stringify({ type: 'assistant/message', text: 'hi' })}\n`,
  ]);
}

const SRC = findFixture();
console.log(SRC ? `夹具 ${SRC}` : '夹具：本机无会话文件，使用构造函数数据');

console.log('projectKey');
eq('work', projectKey('E:\\ruanjianxiazai\\deepseek\\work'), '--E-ruanjianxiazai-deepseek-work--');
eq('default-workspace', projectKey('C:\\Users\\14507\\Documents\\deepseek-harness\\default-workspace'),
  '--C-Users-14507-Documents-deepseek-harness-default-workspace--');
eq('segment roundtrip', decodeSegment(encodeSegment('a b/中文')), 'a b/中文');

console.log('session read');
const buf = SRC ? readFileSync(SRC) : buildFixture();
const header = readHeader(buf);
eq('version', header.version, 4);
ok('cwd 是绝对路径', typeof header.cwd === 'string' && header.cwd.length > 0);
ok('title 非空', typeof readTitle(buf) === 'string' && readTitle(buf).length > 0);
const val = validateSession(buf);
ok('validate ok', val.ok);
// 帧数不写死：这条会话会随着聊天继续增长，跟文件实际帧数比即可
const FRAMES = walkFrames(buf).length;
eq('frames', val.frames, FRAMES);
eq('sha256 length', sha256(buf).length, 64);

console.log('compareSessions（只比 body）');
const moved = rewriteSession(buf, { newCwd: 'D:\\somewhere\\else' }).buffer;
const grown = Buffer.concat([buf, encodeFrame('[{"type":"noop"}]\n')]);
eq('equal 同文件', compareSessions(buf, buf), 'equal');
eq('equal 仅头帧不同', compareSessions(moved, buf), 'equal');
eq('local-ahead 本地多一帧', compareSessions(grown, buf), 'local-ahead');
eq('remote-ahead 远端多一帧', compareSessions(buf, grown), 'remote-ahead');
const corrupted = Buffer.from(buf);
corrupted[corrupted.length - 1] ^= 0xff;
eq('diverged', compareSessions(corrupted, buf), 'diverged');

console.log('rewriteSession');
const rw = rewriteSession(buf, { newCwd: 'D:\\somewhere\\else' });
eq('cwd changed', rw.header.cwd, 'D:\\somewhere\\else');
eq('id kept', rw.header.id, header.id);
eq('frames kept', walkFrames(rw.buffer).length, FRAMES);
ok('rewritten validates', validateSession(rw.buffer).ok);

console.log('parseRepo');
eq('short', parseRepo('lifeng/dsh-sync'), { owner: 'lifeng', repo: 'dsh-sync' });
eq('https', parseRepo('https://github.com/lifeng/dsh-sync.git'), { owner: 'lifeng', repo: 'dsh-sync' });
let threw = false;
try { parseRepo('not a repo'); } catch { threw = true; }
ok('rejects garbage', threw);

console.log('manifest');
const m = createManifest();
const name = registerWorkspace(m, { name: 'work', originalCwd: header.cwd, title: 'work', deviceId: 'dev-1', deviceName: 'DESKTOP-A' });
upsertSession(m, {
  id: header.id, path: sessionPath(name ?? 'work', header.id), project: 'work', originalCwd: header.cwd,
  title: readTitle(buf), createdAt: header.createdAt, updatedAt: Date.now(), bytes: buf.length,
  frames: FRAMES, sha256: sha256(buf), uploadedBy: 'dev-1', uploadedAt: new Date().toISOString(),
});
const text = serializeManifest(m);
const reparsed = parseManifest(text);
eq('roundtrip sessions', Object.keys(reparsed.sessions).length, 1);
const readme = renderReadme(reparsed);
ok('readme has title', readme.includes('DSH 跨设备同步仓库'));
ok('readme links session', readme.includes(readTitle(buf)));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
