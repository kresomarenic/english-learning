#!/usr/bin/env node
/**
 * Migrates all content JSON files:
 *   { "en": "foo", "hr": "bar, baz" }
 *   → { "en": "foo", "hr": ["bar", "baz"] }
 *
 * Splits existing comma-separated strings into arrays.
 * Already-array values are left unchanged.
 */

const fs = require('fs')
const path = require('path')

const contentDir = path.join(__dirname, '../content')

function processFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const data = JSON.parse(raw)

  if (!Array.isArray(data.words)) return false

  let changed = false
  data.words = data.words.map((word) => {
    if (Array.isArray(word.hr)) return word // already done
    if (typeof word.hr !== 'string') return word

    // Split on ", " (comma + space) to get variants
    const parts = word.hr.split(', ').map((s) => s.trim()).filter(Boolean)
    changed = true
    return { ...word, hr: parts }
  })

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
    console.log('✓', path.relative(contentDir, filePath))
  }
  return changed
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      processFile(full)
    }
  }
}

walk(contentDir)
console.log('Done.')
