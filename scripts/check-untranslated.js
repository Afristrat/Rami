const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');
const frData = JSON.parse(fs.readFileSync(path.join(messagesDir, 'fr.json'), 'utf-8'));

function flattenObject(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

const frFlat = flattenObject(frData);
const locales = ['en', 'ar', 'es', 'pt', 'de', 'tr', 'zh'];

console.log(`French source: ${Object.keys(frFlat).length} keys\n`);
console.log('Locale | Total keys | Identical to FR | % untranslated');
console.log('-------|------------|-----------------|---------------');

for (const locale of locales) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const flat = flattenObject(data);

  let identical = 0;
  const identicalKeys = [];

  for (const [key, frValue] of Object.entries(frFlat)) {
    if (flat[key] === frValue) {
      identical++;
      identicalKeys.push(key);
    }
  }

  const totalKeys = Object.keys(flat).length;
  const pct = ((identical / Object.keys(frFlat).length) * 100).toFixed(1);
  console.log(`${locale.padEnd(6)} | ${String(totalKeys).padEnd(10)} | ${String(identical).padEnd(15)} | ${pct}%`);
}
