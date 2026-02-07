type WilayaPriceEntry = {
  wilaya: string
  price: number
  aliases?: string[]
}

const RAW_DELIVERY_PRICES: WilayaPriceEntry[] = [
  { wilaya: 'Adrar', price: 1400 },
  { wilaya: 'Chlef', price: 850 },
  { wilaya: 'Laghouat', price: 950 },
  { wilaya: 'Oum El Bouaghi', price: 850 },
  { wilaya: 'Batna', price: 900 },
  { wilaya: 'Bejaia', price: 800 },
  { wilaya: 'Biskra', price: 950 },
  { wilaya: 'Bechar', price: 1100 },
  { wilaya: 'Blida', price: 600 },
  { wilaya: 'Bouira', price: 700 },
  { wilaya: 'Tamanrasset', price: 1600 },
  { wilaya: 'Tebessa', price: 900 },
  { wilaya: 'Tlemcen', price: 900 },
  { wilaya: 'Tiaret', price: 850 },
  { wilaya: 'Tizi Ouzou', price: 750 },
  { wilaya: 'Alger', price: 400, aliases: ['Algiers'] },
  { wilaya: 'Djelfa', price: 950 },
  { wilaya: 'Jijel', price: 900 },
  { wilaya: 'Setif', price: 800 },
  { wilaya: 'Saida', price: 900 },
  { wilaya: 'Skikda', price: 900 },
  { wilaya: 'Sidi Bel Abbes', price: 900 },
  { wilaya: 'Annaba', price: 850 },
  { wilaya: 'Guelma', price: 900 },
  { wilaya: 'Constantine', price: 800 },
  { wilaya: 'Medea', price: 800 },
  { wilaya: 'Mostaganem', price: 900 },
  { wilaya: "M'Sila", price: 850 },
  { wilaya: 'Mascara', price: 900 },
  { wilaya: 'Ouargla', price: 950 },
  { wilaya: 'Oran', price: 800 },
  { wilaya: 'El Bayadh', price: 1100 },
  { wilaya: 'Illizi', price: 0 },
  { wilaya: 'Bordj Bou Arreridj', price: 800, aliases: ['B. B. Arreridj'] },
  { wilaya: 'Boumerdes', price: 700 },
  { wilaya: 'El Tarf', price: 850 },
  { wilaya: 'Tindouf', price: 0 },
  { wilaya: 'Tissemsilt', price: 900 },
  { wilaya: 'El Oued', price: 950 },
  { wilaya: 'Khenchela', price: 900 },
  { wilaya: 'Souk Ahras', price: 900 },
  { wilaya: 'Tipaza', price: 700 },
  { wilaya: 'Mila', price: 900 },
  { wilaya: 'Ain Defla', price: 900 },
  { wilaya: 'Naama', price: 1100 },
  { wilaya: 'Ain Temouchent', price: 900 },
  { wilaya: 'Ghardaia', price: 950 },
  { wilaya: 'Relizane', price: 900 },
  { wilaya: 'Timimoun', price: 1400 },
  { wilaya: 'Bordj Badji Mokhtar', price: 0, aliases: ['B. B. Mokhtar', 'Bordj Baji Mokhtar'] },
  { wilaya: 'Ouled Djellal', price: 950 },
  { wilaya: 'Beni Abbes', price: 1100 },
  { wilaya: 'In Salah', price: 1600 },
  { wilaya: 'In Guezzam', price: 1600 },
  { wilaya: 'Touggourt', price: 950 },
  { wilaya: 'Djanet', price: 0 },
  { wilaya: 'El Meghaier', price: 950, aliases: ["El M'Ghair"] },
  { wilaya: 'El Menia', price: 1000 },
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

export const DELIVERY_PRICES_BY_WILAYA = RAW_DELIVERY_PRICES.reduce(
  (acc, entry) => {
    const key = normalizeDeliveryKey(entry.wilaya)
    acc[key] = entry.price
    if (entry.aliases) {
      entry.aliases.forEach(alias => {
        acc[normalizeDeliveryKey(alias)] = entry.price
      })
    }
    return acc
  },
  {} as Record<string, number>
)

