/**
 * sync-translations.js
 *
 * Synchronise toutes les locales avec fr.json (source de vérité).
 * Pour chaque clé présente dans fr.json mais absente d'une autre locale,
 * la valeur française est copiée comme fallback.
 * Les traductions existantes ne sont JAMAIS écrasées.
 */

const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, '..', 'messages');
const SOURCE_LOCALE = 'fr';
const TARGET_LOCALES = ['en', 'ar', 'es', 'pt', 'de', 'tr', 'zh'];

/**
 * Recursively collect all leaf key paths from an object.
 * Returns a flat map of dotted-path -> value.
 */
function flattenKeys(obj, prefix) {
  prefix = prefix || '';
  const result = {};
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? prefix + '.' + key : key;
    const val = obj[key];
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, flattenKeys(val, fullKey));
    } else {
      result[fullKey] = val;
    }
  }
  return result;
}

/**
 * Count total leaf keys in a nested object.
 */
function countKeys(obj) {
  let count = 0;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      count += countKeys(val);
    } else {
      count += 1;
    }
  }
  return count;
}

/**
 * Set a value at a dotted path in a nested object, creating intermediate
 * objects as needed. Does NOT overwrite if the key already exists.
 */
function setNestedIfMissing(obj, dottedPath, value) {
  const parts = dottedPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined || current[part] === null || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  const lastPart = parts[parts.length - 1];
  if (current[lastPart] === undefined) {
    current[lastPart] = value;
    return true; // was missing, now added
  }
  return false; // already existed
}

/**
 * Recursively sort object keys to match the order in the reference object.
 * Keys present in target but not in ref are appended at the end.
 */
function sortLikeRef(ref, target) {
  if (ref === null || typeof ref !== 'object' || Array.isArray(ref)) return target;
  if (target === null || typeof target !== 'object' || Array.isArray(target)) return target;

  const sorted = {};
  // First, iterate ref keys in order
  for (const key of Object.keys(ref)) {
    if (key in target) {
      if (typeof ref[key] === 'object' && ref[key] !== null && !Array.isArray(ref[key]) &&
          typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])) {
        sorted[key] = sortLikeRef(ref[key], target[key]);
      } else {
        sorted[key] = target[key];
      }
    }
  }
  // Then, any keys in target not in ref
  for (const key of Object.keys(target)) {
    if (!(key in sorted)) {
      sorted[key] = target[key];
    }
  }
  return sorted;
}

// --- Main ---

console.log('=== RAMI Translation Sync ===\n');

// Load source
const sourcePath = path.join(MESSAGES_DIR, SOURCE_LOCALE + '.json');
const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const sourceFlat = flattenKeys(sourceData);
const sourceKeyCount = Object.keys(sourceFlat).length;
console.log('Source (' + SOURCE_LOCALE + '.json): ' + sourceKeyCount + ' keys\n');

let totalAdded = 0;

for (const locale of TARGET_LOCALES) {
  const targetPath = path.join(MESSAGES_DIR, locale + '.json');
  let targetData;
  try {
    targetData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  } catch (e) {
    console.log('  WARNING: Could not read ' + locale + '.json, creating from scratch');
    targetData = {};
  }

  const beforeCount = countKeys(targetData);
  let addedCount = 0;

  // For every key in source, ensure it exists in target
  for (const [dottedKey, value] of Object.entries(sourceFlat)) {
    const wasAdded = setNestedIfMissing(targetData, dottedKey, value);
    if (wasAdded) {
      addedCount++;
    }
  }

  // Sort keys to match fr.json order
  const sorted = sortLikeRef(sourceData, targetData);

  // Write back
  fs.writeFileSync(targetPath, JSON.stringify(sorted, null, 2) + '\n', 'utf8');

  const afterCount = countKeys(sorted);
  console.log(locale + '.json: ' + beforeCount + ' -> ' + afterCount + ' keys (added ' + addedCount + ')');
  totalAdded += addedCount;
}

console.log('\nTotal keys added across all locales: ' + totalAdded);
console.log('\nDone. All locale files now have the same keys as ' + SOURCE_LOCALE + '.json.');
