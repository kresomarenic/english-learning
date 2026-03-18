#!/usr/bin/env node
/**
 * Enriches Croatian translations with additional accepted variants.
 * Each rule says: for a given English word (exact match), add these extra
 * Croatian variants if they aren't already present.
 *
 * Rules are applied to ALL content files.
 */

const fs = require('fs')
const path = require('path')

const contentDir = path.join(__dirname, '../content')

// Map: English word (lowercase for matching) → extra Croatian variants to add
const VARIANTS = {
  // Family
  'daughter':    ['kći', 'kćer', 'kćerka'],
  'aunt':        ['ujna', 'strina', 'tetka', 'teta'],
  'uncle':       ['ujak', 'stric', 'tetak'],
  'cousin':      ['bratić', 'sestrična'],
  'grandma':     ['baka', 'bakica'],
  'grandpa':     ['djed', 'djedica'],
  'family':      ['obitelj', 'familija'],
  'relatives':   ['rodaci', 'rodbina'],
  'son':         ['sin', 'sinčić'],
  'parents':     ['roditelji'],

  // Animals
  'dolphin':     ['dupin', 'delfin'],
  'hippo':       ['vodeni konj', 'nilski konj'],
  'aliens':      ['vanzemaljci', 'izvanzemaljci'],

  // Tech / modern words
  'laptop':      ['prijenosno računalo', 'laptop'],
  'e-mail':      ['elektronička pošta', 'e-mail', 'email'],
  'computer':    ['računalo', 'kompjuter', 'kompjutor'],
  'animation':   ['animacija'],

  // Adjectives with common synonyms
  'slim':        ['mršav', 'vitak', 'mršava', 'vitka'],
  'pretty':      ['lijep', 'dražestan', 'lijepa', 'dražesna'],
  'clever':      ['pametan', 'pametna', 'inteligentan'],
  'brave':       ['hrabar', 'hrabra'],
  'lazy':        ['lijen', 'lijena'],
  'strong':      ['jak', 'jaka', 'snažan', 'snažna'],
  'cosy':        ['udoban', 'udobna', 'ugodан'],
  'dangerous':   ['opasan', 'opasna'],
  'delicious':   ['ukusan', 'ukusna'],
  'funny':       ['smiješan', 'smiješna'],
  'hard-working':['marljiv', 'marljiva'],
  'gentle':      ['nježan', 'nježna', 'blag', 'blaga'],
  'peaceful':    ['miroljubiv', 'miroljubiva', 'miran', 'mirna'],
  'colourful':   ['šaren', 'šarena', 'živopisan'],

  // Verbs with synonyms
  'laugh':       ['smijati se', 'smijuckati se'],
  'visit':       ['posjetiti', 'posjetiti'],
  'fix':         ['popraviti', 'popravljati'],
  'save':        ['spasiti', 'spašavati'],
  'grab':        ['zgrabiti', 'dohvatiti'],
  'practise':    ['uvježbavati', 'vježbati'],

  // Other common synonyms
  'star':        ['zvijezda'],
  'spaceship':   ['svemirski brod', 'letjelica'],
  'space':       ['svemir', 'svemirski prostor'],
  'insect':      ['kukac', 'insekt'],
  'fan':         ['navijač', 'obožavatelj'],
  'backpack':    ['naprtnjača', 'ruksak'],
  'helmet':      ['kaciga', 'šljem'],
  'countryside': ['priroda', 'izvan grada', 'seoska sredina'],
  'outdoors':    ['izvan kuće', 'na otvorenom', 'vani'],
  'school':      ['škola'],
  'music':       ['glazba', 'muzika'],
  'history':     ['povijest', 'historija'],
  'geography':   ['geografija'],
}

function processFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const data = JSON.parse(raw)

  if (!Array.isArray(data.words)) return false

  let changed = false
  data.words = data.words.map((word) => {
    if (!Array.isArray(word.hr)) return word

    const key = (word.en || '').toLowerCase().trim()
    const rule = VARIANTS[key]
    if (!rule) return word

    // Add any variants from the rule that aren't already in the array
    const current = new Set(word.hr.map(s => s.toLowerCase()))
    const toAdd = rule.filter(v => !current.has(v.toLowerCase()))
    if (toAdd.length === 0) return word

    changed = true
    return { ...word, hr: [...word.hr, ...toAdd] }
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
