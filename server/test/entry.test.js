import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

test('entry starts sidecar, MCP handshake works, SIGTERM ends session', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'retflo-'));
  const child = spawn(process.execPath, [join(SRC, 'index.js')], {
    env: { ...process.env, RETFLO_SESSIONS_DIR: dir, RETFLO_VIEW_PORT: '0' },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', d => { stderr += d; });

  // wait for the sidecar-ready line on stderr: "sidecar http://127.0.0.1:<port>"
  let port = null;
  for (let i = 0; i < 50 && !port; i++) {
    const m = stderr.match(/sidecar http:\/\/127\.0\.0\.1:(\d+)/);
    if (m) port = m[1]; else await sleep(100);
  }
  assert.ok(port, `no sidecar-ready line in stderr:\n${stderr}`);

  const g = await (await fetch(`http://127.0.0.1:${port}/graph`)).json();
  assert.ok(g.nodes.length > 50);

  // MCP initialize over stdio
  child.stdin.write(JSON.stringify({
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '0' } },
  }) + '\n');
  let stdout = '';
  child.stdout.on('data', d => { stdout += d; });
  for (let i = 0; i < 50 && !stdout.includes('"serverInfo"'); i++) await sleep(100);
  assert.ok(stdout.includes('"serverInfo"'), `no initialize response:\n${stdout}`);

  child.kill('SIGTERM');
  await new Promise(res => child.on('exit', res));
  const file = readdirSync(dir).find(f => f.endsWith('.jsonl'));
  const lines = readFileSync(join(dir, file), 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(lines[0].type, 'session_start');
  assert.equal(lines.at(-1).type, 'session_end');
});
