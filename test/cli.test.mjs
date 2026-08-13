import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, cpSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('создаёт локальный отчёт о форме JSON', () => {
  const dir = mkdtempSync(join(tmpdir(), 'json-shape-profiler-'));
  cpSync('examples', join(dir, 'examples'), { recursive: true });
  const out = join(dir, 'report.json');
  const input = join(dir, 'examples', 'items.json');
  const message = execFileSync(process.execPath, ['src/index.mjs', input, '--json', out], { encoding: 'utf8' });
  assert.match(message, /Отчёт сохранён/);
  const body = readFileSync(out, 'utf8');
  assert.match(body, /"id"/);
  assert.match(body, /"missing"/);
});
