// 用假 client 跑一遍上传计划（不联网），验证清单/索引/README 的组装。
// 夹具在临时 DSH_HOME 里现造，不依赖本机真实会话，换机器和 CI 都能跑。
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { projectKey } from '../lib/projectkey.mjs';
import { encodeFrames } from '../lib/zstdframe.mjs';

const home = mkdtempSync(join(tmpdir(), 'dsh-sync-plan-'));
process.env.DSH_HOME = home;

const { planUpload, executeUpload, localSessionFile } = await import('../lib/sync.mjs');
const { listSessionsForCwd } = await import('../lib/localsessions.mjs');

const cwd = join(home, 'workspace');
const id = 'session-11111111-1111-4111-8111-111111111111';
const dir = join(home, 'sessions', projectKey(cwd), id);
mkdirSync(dir, { recursive: true });
const fixture = encodeFrames([
  `${JSON.stringify({ type: 'session', version: 4, id, cwd, createdAt: 1, updatedAt: 1 })}\n`,
  `${JSON.stringify({ type: 'session/title', data: { title: '上传计划夹具' } })}\n`,
  `${JSON.stringify({ type: 'user/message', text: 'hello' })}\n`,
  `${JSON.stringify({ type: 'assistant/message', text: 'hi' })}\n`,
]);
writeFileSync(join(dir, 'session.v4.jsonl.zstd'), fixture);

const all = listSessionsForCwd(cwd);
const target = all.find((s) => s.id === id);
if (!target) { console.error('夹具会话没被扫到:', all.map((s) => s.id)); process.exit(1); }
console.log('目标会话:', target.id, target.title, target.bytes + 'B');
console.log('本地路径存在:', existsSync(localSessionFile(cwd, target.id)));

const commits = [];
const stub = {
  async listFiles() { return { empty: true, map: new Map(), commitSha: null, treeSha: null }; },
  async readFile() { return null; },
  async commitBatch({ files, message }) { commits.push({ files, message }); return { commitSha: 'deadbeef', files: files.length, firstCommit: true }; },
};

const plan = await planUpload({
  client: stub, cwd, ids: [id, 'session-does-not-exist'],
  deviceId: 'dev-1', deviceName: 'DESKTOP-A', projectTitle: 'work',
});

console.log('项目名:', plan.project);
console.log('摘要:', JSON.stringify(plan.summary));
console.log('条目:');
for (const i of plan.items) console.log(`  ${i.action.padEnd(8)} ${i.title ?? '(no title)'} ${i.bytes ?? ''} ${i.reason ?? ''}`);
console.log('将提交的文件:');
for (const f of plan.files) console.log(`  ${f.path}  ${f.content.length}B`);

const manifestFile = plan.files.find((f) => f.path === 'manifest.json');
const readmeFile = plan.files.find((f) => f.path === 'README.md');
const ok = manifestFile && readmeFile && plan.summary.upload === 1 && plan.summary.blocked === 1;
console.log('\nmanifest 片段:', manifestFile ? manifestFile.content.toString('utf8').slice(0, 200).replace(/\n/g, ' ') : '缺失');
console.log('README 片段:', readmeFile ? readmeFile.content.split('\n').slice(0, 6).join(' | ') : '缺失');

const res = await executeUpload({ client: stub, plan, deviceName: 'DESKTOP-A' });
console.log('提交信息:', commits[0]?.message);
console.log('提交结果:', JSON.stringify(res));

console.log(ok ? '\nSELFTEST OK' : '\nSELFTEST FAIL');
process.exit(ok ? 0 : 1);
