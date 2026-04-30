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
const locale = process.argv[2] || 'en';
const filePath = path.join(messagesDir, `${locale}.json`);
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
const flat = flattenObject(data);

const untranslated = {};
for (const [key, frValue] of Object.entries(frFlat)) {
  if (flat[key] === frValue) {
    untranslated[key] = frValue;
  }
}

// Output as JSON for easy consumption
console.log(JSON.stringify(untranslated, null, 2));
