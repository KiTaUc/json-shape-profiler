import { readFile, writeFile } from 'node:fs/promises';

const [file, ...args] = process.argv.slice(2);
const jsonAt = args.indexOf('--json');
const input = JSON.parse(await readFile(file, 'utf8'));
const rows = Array.isArray(input) ? input : [input];

if (!rows.every(row => row !== null && typeof row === 'object' && !Array.isArray(row))) {
  throw new Error('Ожидается JSON-объект или массив JSON-объектов.');
}

function typeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

const keys = [...new Set(rows.flatMap(row => Object.keys(row)))];
const fields = Object.fromEntries(keys.map(name => {
  const values = rows.map(row => row[name]);
  const present = values.filter(value => value !== undefined);
  const typeDistribution = {};

  for (const value of present) {
    const type = typeOf(value);
    typeDistribution[type] = (typeDistribution[type] || 0) + 1;
  }

  const nulls = typeDistribution.null || 0;
  const types = Object.keys(typeDistribution).filter(type => type !== 'null');
  return [name, {
    present: present.length,
    missing: rows.length - present.length,
    nulls,
    types,
    typeDistribution,
  }];
}));

const properties = Object.fromEntries(Object.entries(fields).map(([name, field]) => {
  const schemaTypes = field.types.length ? field.types : ['null'];
  return [name, {
    type: schemaTypes.length === 1 ? schemaTypes[0] : schemaTypes,
    nullable: field.nulls > 0,
  }];
}));
const objectSchema = {
  type: 'object',
  properties,
  required: Object.entries(fields)
    .filter(([, field]) => field.missing === 0)
    .map(([name]) => name),
};
const schema = Array.isArray(input)
  ? { type: 'array', items: objectSchema }
  : objectSchema;
const report = { rows: rows.length, schema, fields };

if (jsonAt >= 0) {
  await writeFile(args[jsonAt + 1] || 'json-shape-profile.json', JSON.stringify(report, null, 2));
  console.log('Отчёт сохранён.');
} else {
  console.log(Object.entries(fields)
    .map(([name, field]) => `${name}: ${field.types.join('|') || 'null'}, пропусков ${field.missing}, null ${field.nulls}, распределение ${JSON.stringify(field.typeDistribution)}`)
    .join('\n'));
}
