import cli from 'sanity/cli'

const client = cli.getCliClient({ apiVersion: '2024-01-01' })
const DOC_ID = 'sellYourCarPage'

const doc = await client.getDocument(DOC_ID)
if (!doc) {
  console.log('Document not found:', DOC_ID)
  process.exit(0)
}

const rows = doc?.comparisonTable?.rows
if (!Array.isArray(rows)) {
  console.log('No rows array found, nothing to migrate')
  process.exit(0)
}

const migratedRows = rows.map((row, idx) => {
  if (Array.isArray(row)) {
    const columns = row.map((value) => (value == null ? '' : String(value)))
    return {
      _type: 'sellComparisonRow',
      _key: `row-${idx + 1}`,
      feature: columns[0] || '',
      us: columns[1] || '',
      others: columns[2] || '',
      tradeIn: columns[3] || '',
      columns,
    }
  }

  if (row && typeof row === 'object') {
    return {
      ...row,
      _type: row._type || 'sellComparisonRow',
      _key: row._key || `row-${idx + 1}`,
    }
  }

  return {
    _type: 'sellComparisonRow',
    _key: `row-${idx + 1}`,
    feature: '',
    us: '',
    others: '',
    tradeIn: '',
    columns: [],
  }
})

if (JSON.stringify(rows) === JSON.stringify(migratedRows)) {
  console.log('Rows already normalized, no changes needed')
  process.exit(0)
}

await client.patch(DOC_ID).set({ 'comparisonTable.rows': migratedRows }).commit()
console.log('Migration applied:', DOC_ID, 'rows:', migratedRows.length)
