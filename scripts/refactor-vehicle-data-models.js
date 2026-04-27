#!/usr/bin/env node
/**
 * Refactor vehicle-data.ts to use makeModel() for all model definitions
 * This eliminates the structural duplication of { name: "X", trims: [...] } patterns
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../lib/vehicle-data.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Convert model definitions to use makeModel
// Pattern: { name: "ModelName", trims: [...]}, → makeModel("ModelName", [...]),
content = content.replace(
  /{ name: "([^"]+)", trims: \[/g,
  'makeModel("$1", ['
);

// Remove the closing }}, for model definitions and replace with ]),
content = content.replace(/\s*\]},$/gm, '],');
content = content.replace(/\s*\]}\s*$/gm, ']');

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Refactored vehicle-data.ts to use makeModel()');
console.log('   - Converted all model definitions to use makeModel() helper');
console.log('   - This should eliminate model structure duplication');
