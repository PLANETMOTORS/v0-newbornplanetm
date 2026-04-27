const https = require('https');

const PROJECT_ID = 'wlxj8olw';
const DATASET = 'production';
const TOKEN = process.env.SANITY_API_TOKEN;

async function query(groq) {
  const url = `https://${PROJECT_ID}.api.sanity.io/v2021-06-07/data/query/${DATASET}?query=${encodeURIComponent(groq)}`;
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { Authorization: `Bearer ${TOKEN}` } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data).result));
    });
    req.on('error', reject);
  });
}

function getAllFields(obj, prefix = '') {
  const fields = [];
  if (!obj || typeof obj !== 'object') return fields;
  
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('_')) continue;
    const fieldPath = prefix ? `${prefix}.${key}` : key;
    fields.push(fieldPath);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      fields.push(...getAllFields(value, fieldPath));
    }
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      fields.push(...getAllFields(value[0], `${fieldPath}[]`));
    }
  }
  return fields;
}

async function main() {
  console.log('=== FINDING ALL MISSING FIELDS ===\n');
  
  // Get ALL documents with their full data
  const docs = await query(`*[_type in ["homepage", "financingPage", "sellYourCarPage", "sellPage", "aiSettings", "siteSettings", "navigation", "faqItem", "testimonial", "lender", "protectionPlan"]][0...50]`);
  
  const fieldsByType = {};
  
  for (const doc of docs) {
    const type = doc._type;
    if (!fieldsByType[type]) fieldsByType[type] = new Set();
    const fields = getAllFields(doc);
    fields.forEach(f => fieldsByType[type].add(f));
  }
  
  console.log('=== ALL FIELDS BY DOCUMENT TYPE ===\n');
  
  for (const [type, fields] of Object.entries(fieldsByType)) {
    console.log(`\n--- ${type.toUpperCase()} (${fields.size} fields) ---`);
    const sortedFields = Array.from(fields).sort((a, b) => a.localeCompare(b));
    sortedFields.forEach(f => console.log(`  ${f}`));
  }
  
  // Specific deep dive into problematic documents
  console.log('\n\n=== DEEP DIVE: AI SETTINGS ===');
  const aiSettings = await query(`*[_type == "aiSettings"][0]`);
  if (aiSettings) {
    console.log(JSON.stringify(aiSettings, null, 2));
  }
  
  console.log('\n\n=== DEEP DIVE: SITE SETTINGS ===');
  const siteSettings = await query(`*[_type == "siteSettings"][0]`);
  if (siteSettings) {
    console.log(JSON.stringify(siteSettings, null, 2));
  }
  
  console.log('\n\n=== DEEP DIVE: HOMEPAGE ===');
  const homepage = await query(`*[_type == "homepage"][0]`);
  if (homepage) {
    console.log(JSON.stringify(homepage, null, 2));
  }
  
  console.log('\n\n=== DEEP DIVE: FINANCING PAGE ===');
  const financingPage = await query(`*[_type == "financingPage"][0]`);
  if (financingPage) {
    console.log(JSON.stringify(financingPage, null, 2));
  }
  
  console.log('\n\n=== DEEP DIVE: SELL YOUR CAR PAGE ===');
  const sellYourCarPage = await query(`*[_type == "sellYourCarPage"][0]`);
  if (sellYourCarPage) {
    console.log(JSON.stringify(sellYourCarPage, null, 2));
  }
}

main().catch(console.error);
