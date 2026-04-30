#!/bin/bash
set -e

echo "=== RAMI Pre-Deploy Check ==="
echo ""

echo "1. TypeScript..."
npx tsc --noEmit
echo "   ✓ Zero errors"

echo "2. Lint..."
npm run lint
echo "   ✓ Clean"

echo "3. npm audit..."
npm audit --audit-level=critical || echo "   ⚠ Review audit results"

echo "4. JSON translations..."
for f in messages/*.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" && echo "   ✓ $f"
done

echo "5. Translation key parity..."
node -e "
const fs = require('fs');
const fr = JSON.parse(fs.readFileSync('messages/fr.json','utf8'));
const count = (o) => Object.keys(o).reduce((a,k) => a + (typeof o[k]==='object' && o[k]!==null ? count(o[k]) : 1), 0);
const frCount = count(fr);
let ok = true;
['en','ar','es','pt','de','tr','zh'].forEach(l => {
  const j = JSON.parse(fs.readFileSync('messages/'+l+'.json','utf8'));
  const c = count(j);
  if (c !== frCount) { console.log('   ✗ '+l+'.json: '+c+' keys (expected '+frCount+')'); ok = false; }
  else console.log('   ✓ '+l+'.json: '+c+' keys');
});
if (!ok) process.exit(1);
"

echo "6. No hardcoded fr-FR..."
MATCHES=\$(grep -rn '"fr-FR"' src/ --include="*.tsx" --include="*.ts" | grep -v format-locale.ts | grep -v node_modules | wc -l)
if [ "\$MATCHES" -gt "0" ]; then echo "   ✗ Found \$MATCHES hardcoded fr-FR"; exit 1; fi
echo "   ✓ Zero hardcoded locales"

echo "7. No console.log in production..."
CONSOLES=\$(grep -rn 'console\.' src/lib src/app --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v scripts/ | grep -v "eslint-disable" | wc -l)
if [ "\$CONSOLES" -gt "0" ]; then echo "   ✗ Found \$CONSOLES console statements"; exit 1; fi
echo "   ✓ Zero console.log"

echo "8. Build..."
npm run build
echo "   ✓ Build successful"

echo ""
echo "=== All checks passed! Ready to deploy. ==="
