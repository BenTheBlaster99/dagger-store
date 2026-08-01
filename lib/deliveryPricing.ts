export type WilayaTarif = {
  code: number
  wilaya: string
  home: number
  bureau: number
  aliases?: string[]
}

const ALIASES: Record<string, string[]> = {
  Alger: ['Algiers'],
  Bejaia: ['Béjaïa'],
  Bechar: ['Béchar'],
  Setif: ['Sétif'],
  Tebessa: ['Tébessa'],
  'Bordj Bou Arreridj': ['Bordj Bou Arréridj', 'B. B. Arreridj'],
  'El Meghaier': ["El M'Ghair"],
  Medea: ['Médéa'],
  Boumerdes: ['Boumerdès'],
  'Ain Defla': ['Aïn Defla'],
  'Ain Temouchent': ['Aïn Témouchent'],
  'El Menia': ["El Meniaa", "El Ménia"],
}

export const WILAYA_TARIFS: WilayaTarif[] = [
  { code: 1, wilaya: 'Adrar', home: 1100, bureau: 750 },
  { code: 2, wilaya: 'Chlef', home: 680, bureau: 400 },
  { code: 3, wilaya: 'Laghouat', home: 880, bureau: 550 },
  { code: 4, wilaya: 'Oum El Bouaghi', home: 700, bureau: 350 },
  { code: 5, wilaya: 'Batna', home: 700, bureau: 400 },
  { code: 6, wilaya: 'Bejaia', home: 700, bureau: 400 },
  { code: 7, wilaya: 'Biskra', home: 950, bureau: 620 },
  { code: 8, wilaya: 'Bechar', home: 1100, bureau: 720 },
  { code: 9, wilaya: 'Blida', home: 500, bureau: 350 },
  { code: 10, wilaya: 'Bouira', home: 700, bureau: 520 },
  { code: 11, wilaya: 'Tamanrasset', home: 1600, bureau: 1120 },
  { code: 12, wilaya: 'Tebessa', home: 900, bureau: 570 },
  { code: 13, wilaya: 'Tlemcen', home: 900, bureau: 570 },
  { code: 14, wilaya: 'Tiaret', home: 850, bureau: 520 },
  { code: 15, wilaya: 'Tizi Ouzou', home: 630, bureau: 400 },
  { code: 16, wilaya: 'Alger', home: 450, bureau: 200 },
  { code: 17, wilaya: 'Djelfa', home: 950, bureau: 570 },
  { code: 18, wilaya: 'Jijel', home: 900, bureau: 520 },
  { code: 19, wilaya: 'Sétif', home: 690, bureau: 400 },
  { code: 20, wilaya: 'Saida', home: 900, bureau: 570 },
  { code: 21, wilaya: 'Skikda', home: 900, bureau: 520 },
  { code: 22, wilaya: 'Sidi Bel Abbès', home: 900, bureau: 520 },
  { code: 23, wilaya: 'Annaba', home: 700, bureau: 400 },
  { code: 24, wilaya: 'Guelma', home: 900, bureau: 520 },
  { code: 25, wilaya: 'Constantine', home: 680, bureau: 400 },
  { code: 26, wilaya: 'Medea', home: 800, bureau: 520 },
  { code: 27, wilaya: 'Mostaganem', home: 900, bureau: 520 },
  { code: 28, wilaya: 'M\'Sila', home: 850, bureau: 570 },
  { code: 29, wilaya: 'Mascara', home: 900, bureau: 520 },
  { code: 30, wilaya: 'Ouargla', home: 950, bureau: 670 },
  { code: 31, wilaya: 'Oran', home: 580, bureau: 380 },
  { code: 32, wilaya: 'El Bayadh', home: 1100, bureau: 670 },
  { code: 33, wilaya: 'Illizi', home: 1700, bureau: 1200 },
  { code: 34, wilaya: 'Bordj Bou Arreridj', home: 800, bureau: 520 },
  { code: 35, wilaya: 'Boumerdes', home: 550, bureau: 350 },
  { code: 36, wilaya: 'El Tarf', home: 850, bureau: 520 },
  { code: 37, wilaya: 'Tindouf', home: 1350, bureau: 900 },
  { code: 38, wilaya: 'Tissemsilt', home: 900, bureau: 520 },
  { code: 39, wilaya: 'El Oued', home: 950, bureau: 670 },
  { code: 40, wilaya: 'Khenchela', home: 900, bureau: 520 },
  { code: 41, wilaya: 'Souk Ahras', home: 900, bureau: 520 },
  { code: 42, wilaya: 'Tipaza', home: 550, bureau: 350 },
  { code: 43, wilaya: 'Mila', home: 900, bureau: 520 },
  { code: 44, wilaya: 'Ain Defla', home: 900, bureau: 520 },
  { code: 45, wilaya: 'Naama', home: 1100, bureau: 670 },
  { code: 46, wilaya: 'Ain Temouchent', home: 900, bureau: 520 },
  { code: 47, wilaya: 'Ghardaia', home: 950, bureau: 620 },
  { code: 48, wilaya: 'Relizane', home: 900, bureau: 520 },
  { code: 49, wilaya: 'Timimoun', home: 1400, bureau: 1000 },
  { code: 50, wilaya: 'Bordj Badji Mokhtar', home: 0, bureau: 0 },
  { code: 51, wilaya: 'Ouled Djellal', home: 950, bureau: 620 },
  { code: 52, wilaya: 'Béni Abbès', home: 1100, bureau: 970 },
  { code: 53, wilaya: 'In Salah', home: 1600, bureau: 1100 },
  { code: 54, wilaya: 'In Guezzam', home: 0, bureau: 0 },
  { code: 55, wilaya: 'Touggourt', home: 950, bureau: 670 },
  { code: 56, wilaya: 'Djanet', home: 2400, bureau: 1750 },
  { code: 57, wilaya: 'M\'Ghair', home: 950, bureau: 0 },
  { code: 58, wilaya: 'Meniaa', home: 1000, bureau: 550 },
]

export function normalizeDeliveryKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export type DeliveryPricingEntry = {
  home: number
  bureau: number
  base: number
  wilaya: string
}

export const DELIVERY_PRICES_BY_WILAYA = WILAYA_TARIFS.reduce(
  (acc, entry) => {
    const payload: DeliveryPricingEntry = {
      home: entry.home,
      bureau: entry.bureau,
      base: entry.home,
      wilaya: entry.wilaya,
    }
    const keys = [entry.wilaya, ...(ALIASES[entry.wilaya] || [])]
    for (const key of keys) {
      acc[normalizeDeliveryKey(key)] = payload
    }
    return acc
  },
  {} as Record<string, DeliveryPricingEntry>
)

export function getWilayaDelivery(wilaya: string, method: 'home' | 'bureau' = 'home') {
  const entry = DELIVERY_PRICES_BY_WILAYA[normalizeDeliveryKey(wilaya)]
  if (!entry) return null
  return method === 'bureau' ? entry.bureau : entry.home
}
