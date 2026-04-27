#!/usr/bin/env node
/**
 * Refactor vehicle-data.ts to use makeTrim() helper function
 * Converts inline trim object literals to function calls to reduce SonarCloud duplication
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../lib/vehicle-data.ts');
let content = fs.readFileSync(filePath, 'utf8');

let conversions = 0;

// Convert trim objects with all three fields: { name: "X", transmission: "Y", engine: "Z" } -> makeTrim("X", "Y", "Z")
content = content.replace(
  /{ name: "([^"]+)", transmission: "([^"]+)", engine: "([^"]+)" }/g,
  (match, name, transmission, engine) => {
    conversions++;
    return `makeTrim("${name}", "${transmission}", "${engine}")`;
  }
);

// Convert trim objects with only name: { name: "X" } -> makeTrim("X")
// But NOT the ones that have ", models:" or ", trims:" after them
content = content.replace(
  /{ name: "([^"]+)" }(?![^{]*(?:models|trims):)/g,
  (match, name) => {
    conversions++;
    return `makeTrim("${name}")`;
  }
);

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log(`✅ Refactored vehicle-data.ts`);
console.log(`   - Converted ${conversions} inline trim objects to use makeTrim()`);
console.log(`   - This should significantly reduce SonarCloud duplication warnings`);
