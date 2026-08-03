/**
 * Fetch communes for Algeria's 58 wilayas from French Wikipedia (batched).
 * Source index: https://fr.wikipedia.org/wiki/Liste_des_communes_d'Algérie
 *
 * Run: node scripts/fetch-algeria-communes.js
 */
const fs = require('fs')
const path = require('path')

const UA = 'DaggerStoreBot/1.0 (e-commerce checkout commune sync; local)'

/** code → tarif key → Wikipedia page title (exact) */
const WILAYAS = [
  { code: 1, key: 'Adrar', page: "Liste des communes de la wilaya d'Adrar" },
  { code: 2, key: 'Chlef', page: 'Communes de la wilaya de Chlef' },
  { code: 3, key: 'Laghouat', page: 'Communes de la wilaya de Laghouat' },
  { code: 4, key: 'Oum El Bouaghi', page: "Communes de la wilaya d'Oum El Bouaghi" },
  { code: 5, key: 'Batna', page: 'Communes de la wilaya de Batna' },
  { code: 6, key: 'Bejaia', page: 'Communes de la wilaya de Béjaïa' },
  { code: 7, key: 'Biskra', page: 'Communes de la wilaya de Biskra' },
  { code: 8, key: 'Bechar', page: 'Communes de la wilaya de Béchar' },
  { code: 9, key: 'Blida', page: 'Communes de la wilaya de Blida' },
  { code: 10, key: 'Bouira', page: 'Communes de la wilaya de Bouira' },
  { code: 11, key: 'Tamanrasset', page: 'Communes de la wilaya de Tamanrasset' },
  { code: 12, key: 'Tebessa', page: 'Communes de la wilaya de Tébessa' },
  { code: 13, key: 'Tlemcen', page: 'Communes de la wilaya de Tlemcen' },
  { code: 14, key: 'Tiaret', page: 'Communes de la wilaya de Tiaret' },
  { code: 15, key: 'Tizi Ouzou', page: 'Communes de la wilaya de Tizi Ouzou' },
  { code: 16, key: 'Alger', page: "Liste des communes de la wilaya d'Alger" },
  { code: 17, key: 'Djelfa', page: 'Communes de la wilaya de Djelfa' },
  { code: 18, key: 'Jijel', page: 'Communes de la wilaya de Jijel' },
  { code: 19, key: 'Sétif', page: 'Communes de la wilaya de Sétif' },
  { code: 20, key: 'Saida', page: 'Communes de la wilaya de Saïda' },
  { code: 21, key: 'Skikda', page: 'Communes de la wilaya de Skikda' },
  { code: 22, key: 'Sidi Bel Abbès', page: 'Communes de la wilaya de Sidi Bel Abbès' },
  { code: 23, key: 'Annaba', page: "Communes de la wilaya d'Annaba" },
  { code: 24, key: 'Guelma', page: 'Communes de la wilaya de Guelma' },
  { code: 25, key: 'Constantine', page: 'Communes de la wilaya de Constantine' },
  { code: 26, key: 'Medea', page: 'Communes de la wilaya de Médéa' },
  { code: 27, key: 'Mostaganem', page: 'Communes de la wilaya de Mostaganem' },
  { code: 28, key: "M'Sila", page: "Communes de la wilaya de M'Sila" },
  { code: 29, key: 'Mascara', page: 'Communes de la wilaya de Mascara' },
  { code: 30, key: 'Ouargla', page: "Communes de la wilaya d'Ouargla" },
  { code: 31, key: 'Oran', page: "Communes de la wilaya d'Oran" },
  { code: 32, key: 'El Bayadh', page: "Communes de la wilaya d'El Bayadh" },
  { code: 33, key: 'Illizi', page: "Communes de la wilaya d'Illizi" },
  { code: 34, key: 'Bordj Bou Arreridj', page: 'Communes de la wilaya de Bordj Bou Arreridj' },
  { code: 35, key: 'Boumerdes', page: 'Communes de la wilaya de Boumerdès' },
  { code: 36, key: 'El Tarf', page: "Communes de la wilaya d'El Tarf" },
  { code: 37, key: 'Tindouf', page: 'Communes de la wilaya de Tindouf' },
  { code: 38, key: 'Tissemsilt', page: 'Communes de la wilaya de Tissemsilt' },
  { code: 39, key: 'El Oued', page: "Communes de la wilaya d'El Oued" },
  { code: 40, key: 'Khenchela', page: 'Communes de la wilaya de Khenchela' },
  { code: 41, key: 'Souk Ahras', page: 'Communes de la wilaya de Souk Ahras' },
  { code: 42, key: 'Tipaza', page: 'Communes de la wilaya de Tipaza' },
  { code: 43, key: 'Mila', page: 'Communes de la wilaya de Mila' },
  { code: 44, key: 'Ain Defla', page: "Communes de la wilaya d'Aïn Defla" },
  { code: 45, key: 'Naama', page: 'Communes de la wilaya de Naâma' },
  { code: 46, key: 'Ain Temouchent', page: "Communes de la wilaya d'Aïn Témouchent" },
  { code: 47, key: 'Ghardaia', page: 'Communes de la wilaya de Ghardaïa' },
  { code: 48, key: 'Relizane', page: 'Communes de la wilaya de Relizane' },
  { code: 49, key: 'Timimoun', page: 'Communes de la wilaya de Timimoun' },
  { code: 50, key: 'Bordj Badji Mokhtar', page: 'Liste des communes de la wilaya de Bordj Badji Mokhtar' },
  { code: 51, key: 'Ouled Djellal', page: "Communes de la wilaya d'Ouled Djellal" },
  { code: 52, key: 'Béni Abbès', page: 'Communes de la wilaya de Béni Abbès' },
  { code: 53, key: 'In Salah', page: "Liste des communes de la wilaya d'In Salah" },
  { code: 54, key: 'In Guezzam', page: "Liste des communes de la wilaya d'In Guezzam" },
  { code: 55, key: 'Touggourt', page: 'Liste des communes de la wilaya de Touggourt' },
  { code: 56, key: 'Djanet', page: 'Liste des communes de la wilaya de Djanet' },
  { code: 57, key: 'El Meghaier', page: "Liste des communes de la wilaya d'El M'Ghair" },
  { code: 58, key: 'El Menia', page: "Liste des communes de la wilaya d'El Meniaa" },
]

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function stripWikiNoise(s) {
  return String(s || '')
    .replace(/<\/?big>/gi, '')
    .replace(/<\/?small>/gi, '')
    .replace(/<\/?br\s*\/?>/gi, ' ')
    .replace(/'{2,}/g, '')
    .replace(/\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g, (_, t, a) => a || t)
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function displayName(target, alias) {
  const cleanedAlias = stripWikiNoise(alias)
  const cleanedTarget = stripWikiNoise(target)
  // Prefer clean alias; if alias is empty/noisy, use article title (drop disambiguator)
  let raw = cleanedAlias || cleanedTarget
  if (!raw) return null
  if (raw.startsWith(':')) return null
  if (/^(fichier|image|catégorie|category|modèle|template|aide|help):/i.test(raw)) return null
  if (/^daïra\b/i.test(raw) || /^daira\b/i.test(raw)) return null
  if (/^wilaya\b/i.test(raw)) return null
  // Drop "(Wilaya)" / "(Aïn Defla)" style disambiguators from titles when no clean alias
  if (!cleanedAlias && /\([^)]+\)\s*$/.test(cleanedTarget)) {
    raw = cleanedTarget.replace(/\s*\([^)]+\)\s*$/, '').trim()
  }
  if (/[\u0600-\u06FF]/.test(raw) && !/[A-Za-zÀ-ÿ]/.test(raw)) return null
  return raw.replace(/\s+/g, ' ').trim() || null
}

function extractFromWikitext(wikitext) {
  // Prefer current communes — cut off historical sections
  const cut = wikitext.split(
    /==\s*Anciennes? communes|==\s*Avant 2019|==\s*Avant l'|==\s*Notes et références|==\s*Voir aussi/i
  )[0]

  const seen = new Set()
  const communes = []

  function add(name) {
    if (!name || name.length < 2) return
    if (/^\d+$/.test(name)) return
    if (/[\u0600-\u06FF]/.test(name)) return
    const key = name.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    communes.push(name)
  }

  // Bullet / numbered lists: * [[X]] or # [[X|Y]]  (stub pages)
  const listNames = []
  for (const m of cut.matchAll(/^\s*[*#]+\s*\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/gm)) {
    const name = displayName(m[1], m[2])
    if (name) listNames.push(name)
  }
  if (listNames.length >= 2) {
    for (const n of listNames) add(n)
    return communes.sort((a, b) => a.localeCompare(b, 'fr'))
  }

  // Table pages — rows separated by |---- / |------ / |-
  const tableStart = cut.search(/\{\|\s*[^\n]*wikitable/i)
  if (tableStart >= 0) {
    const tablePart = cut.slice(tableStart)
    const rows = tablePart.split(/\n\|[\-\+]+\n/)
    for (const row of rows) {
      if (/à partir de 2019|commune de la wilaya de/i.test(row)) continue
      // First wiki-link in the row is the commune (daira links come later)
      const links = [...row.matchAll(/\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g)]
      for (const link of links) {
        const name = displayName(link[1], link[2])
        if (!name) continue
        add(name)
        break
      }
    }
  }

  // Fallback: ||[[link]] cells
  if (communes.length < 2) {
    for (const m of cut.matchAll(/\|\|?\s*\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g)) {
      const name = displayName(m[1], m[2])
      if (name) add(name)
    }
  }

  return communes.sort((a, b) => a.localeCompare(b, 'fr'))
}

async function fetchBatch(titles, attempt = 1) {
  const url =
    'https://fr.wikipedia.org/w/api.php?' +
    new URLSearchParams({
      action: 'query',
      format: 'json',
      prop: 'revisions',
      rvprop: 'content',
      rvslots: 'main',
      redirects: '1',
      titles: titles.join('|'),
    })

  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
  })

  if (res.status === 429 || res.status === 503) {
    if (attempt > 6) throw new Error(`HTTP ${res.status} after retries`)
    const wait = 8000 * attempt
    console.log(`  rate-limited, waiting ${wait}ms…`)
    await sleep(wait)
    return fetchBatch(titles, attempt + 1)
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error.info || JSON.stringify(data.error))

  /** @type {Record<string, string>} */
  const byTitle = {}
  const pages = data.query?.pages || {}
  const normalized = {}
  for (const n of data.query?.normalized || []) normalized[n.from] = n.to
  const redirected = {}
  for (const r of data.query?.redirects || []) redirected[r.from] = r.to

  for (const page of Object.values(pages)) {
    if (page.missing != null) continue
    const text = page.revisions?.[0]?.slots?.main?.['*']
    if (typeof text === 'string') byTitle[page.title] = text
  }

  // Map requested titles → content (follow normalize/redirect)
  const out = {}
  for (const t of titles) {
    let cur = t
    if (normalized[cur]) cur = normalized[cur]
    if (redirected[cur]) cur = redirected[cur]
    out[t] = byTitle[cur] || null
  }
  return out
}

async function main() {
  const result = {}
  const report = []

  // Wikipedia allows up to 50 titles per query — use 2 batches
  const batches = [WILAYAS.slice(0, 29), WILAYAS.slice(29)]

  /** @type {Record<string, string|null>} */
  const wikitextByPage = {}

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    console.log(`Fetching batch ${i + 1}/${batches.length} (${batch.length} pages)…`)
    const map = await fetchBatch(batch.map((w) => w.page))
    Object.assign(wikitextByPage, map)
    if (i < batches.length - 1) await sleep(2500)
  }

  for (const w of WILAYAS) {
    const text = wikitextByPage[w.page]
    if (!text) {
      result[w.key] = []
      report.push({ code: w.code, key: w.key, count: 0, ok: false, error: 'missing page/content' })
      console.log(`[${String(w.code).padStart(2, '0')}] ${w.key}: MISSING`)
      continue
    }
    const communes = extractFromWikitext(text)
    result[w.key] = communes
    report.push({ code: w.code, key: w.key, count: communes.length, ok: communes.length > 0 })
    console.log(`[${String(w.code).padStart(2, '0')}] ${w.key}: ${communes.length} communes`)
  }

  const failed = report.filter((r) => !r.ok)
  const total = report.reduce((s, r) => s + r.count, 0)
  console.log(`\nDone: ${total} communes across ${report.filter((r) => r.ok).length}/58 wilayas`)
  if (failed.length) {
    console.log('Failed/empty:')
    for (const f of failed) console.log(`  ${f.code} ${f.key}: ${f.error || '0'}`)
  }

  const outPath = path.join(__dirname, '..', 'lib', 'algeriaCommunes.ts')
  const body = `/**
 * Communes by wilaya (58 official wilayas).
 * Generated from French Wikipedia:
 * https://fr.wikipedia.org/wiki/Liste_des_communes_d'Algérie
 *
 * Re-run: node scripts/fetch-algeria-communes.js
 */

export const ALGERIA_COMMUNES: Record<string, string[]> = ${JSON.stringify(result, null, 2)}

/** Lookup communes for a wilaya name (supports common aliases). */
export function getCommunesForWilaya(wilaya: string): string[] {
  if (!wilaya) return []
  if (ALGERIA_COMMUNES[wilaya]?.length) return ALGERIA_COMMUNES[wilaya]

  const aliases: Record<string, string> = {
    Algiers: 'Alger',
    Béjaïa: 'Bejaia',
    Bejaia: 'Bejaia',
    Béchar: 'Bechar',
    Bechar: 'Bechar',
    Tébessa: 'Tebessa',
    Tebessa: 'Tebessa',
    Sétif: 'Sétif',
    Setif: 'Sétif',
    Saïda: 'Saida',
    Saida: 'Saida',
    Médéa: 'Medea',
    Medea: 'Medea',
    Boumerdès: 'Boumerdes',
    Boumerdes: 'Boumerdes',
    'Aïn Defla': 'Ain Defla',
    'Ain Defla': 'Ain Defla',
    'Aïn Témouchent': 'Ain Temouchent',
    'Ain Temouchent': 'Ain Temouchent',
    Ghardaïa: 'Ghardaia',
    Ghardaia: 'Ghardaia',
    "El M'Ghair": 'El Meghaier',
    'El Meghaier': 'El Meghaier',
    'El Meniaa': 'El Menia',
    'El Ménia': 'El Menia',
    'Bordj Bou Arréridj': 'Bordj Bou Arreridj',
  }

  const mapped = aliases[wilaya]
  if (mapped && ALGERIA_COMMUNES[mapped]?.length) return ALGERIA_COMMUNES[mapped]

  const lower = wilaya.toLowerCase()
  const hit = Object.keys(ALGERIA_COMMUNES).find((k) => k.toLowerCase() === lower)
  return hit ? ALGERIA_COMMUNES[hit] : []
}
`
  fs.writeFileSync(outPath, body, 'utf8')
  fs.writeFileSync(
    path.join(__dirname, 'communes-fetch-report.json'),
    JSON.stringify({ total, report, generatedAt: new Date().toISOString() }, null, 2)
  )
  console.log(`Wrote ${outPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
