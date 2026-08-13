import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, cpSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('создаёт схему, nullable-поля и распределение типов по локальному JSON', () => {
  const dir = mkdtempSync(join(tmpdir(), 'json-shape-profiler-'));
  cpSync('examples', join(dir, 'examples'), { recursive: true });
  const out = join(dir, 'report.json');
  const input = join(dir, 'examples', 'items.json');
  const message = execFileSync(process.execPath, ['src/index.mjs', input, '--json', out], { encoding: 'utf8' });
  assert.match(message, /Отчёт сохранён/);

  const report = JSON.parse(readFileSync(out, 'utf8'));
  assert.equal(report.schema.type, 'array');
  assert.equal(report.schema.items.type, 'object');
  assert.deepEqual(report.schema.items.required, ['id', 'name']);
  assert.deepEqual(report.fields.id.typeDistribution, { number: 2 });
  assert.deepEqual(report.fields.tag.typeDistribution, { null: 1 });
  assert.equal(report.schema.items.properties.tag.nullable, true);
});
