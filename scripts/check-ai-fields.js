const https = require('https');

const PROJECT_ID = '4588vjsz';
const DATASET = 'production';
const TOKEN = process.env.SANITY_API_TOKEN;

async function query(groq) {
  const url = `https://${PROJECT_ID}.api.sanity.io/v2021-10-21/data/query/${DATASET}?query=${encodeURIComponent(groq)}`;
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Authorization: `Bearer ${TOKEN}` } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== AI SETTINGS FULL STRUCTURE ===\n');
  
  // Get aiSettings document with ALL fields
  const aiSettings = await query(`*[_type == "aiSettings"][0]`);
  console.log('AI Settings Document:');
  console.log(JSON.stringify(aiSettings.result, null, 2));
  
  console.log('\n=== HOMEPAGE MISSING FIELDS ===\n');
  const homepage = await query(`*[_type == "homepage"][0]`);
  console.log('Homepage Document:');
  console.log(JSON.stringify(homepage.result, null, 2));
  
  console.log('\n=== FINANCING PAGE MISSING FIELDS ===\n');
  const financingPage = await query(`*[_type == "financingPage"][0]`);
  console.log('Financing Page Document:');
  console.log(JSON.stringify(financingPage.result, null, 2));
  
  console.log('\n=== SITE SETTINGS FULL STRUCTURE ===\n');
  const siteSettings = await query(`*[_type == "siteSettings"]`);
  console.log('Site Settings Documents:');
  console.log(JSON.stringify(siteSettings.result, null, 2));
}

main().catch(console.error);
