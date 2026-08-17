/**
 * Curated coordinate lookup for Northeast India travel spots + major Indian
 * origin cities. Shared by JourneyMap (itinerary route) and InspirationMap
 * (saved inspiration locations) so both draw from the same verified data —
 * no invented coordinates.
 */

export const CITY_COORDS: Record<string, [number, number]> = {
  // Northeast hub
  Guwahati:        [26.1445, 91.7362],

  // Meghalaya
  Shillong:        [25.5788, 91.8933],
  Cherrapunji:     [25.2744, 91.7254],
  Sohra:           [25.2744, 91.7254],
  Dawki:           [25.1897, 92.0204],
  Mawlynnong:      [25.2036, 91.9716],
  Mawsynram:       [25.2987, 91.5827],
  Jowai:           [25.4527, 92.2046],
  Nongpoh:         [25.9040, 91.8780],
  Mawphlang:       [25.4614, 91.7278],
  Laitlum:         [25.5280, 91.9760],
  Nohkalikai:      [25.2546, 91.7162],
  "Elephant Falls": [25.5510, 91.8450],
  "Ward's Lake":   [25.5740, 91.8936],

  // Arunachal Pradesh
  Tawang:          [27.5868, 91.8694],
  Itanagar:        [27.0844, 93.6053],
  Ziro:            [27.5487, 93.8295],
  Bomdila:         [27.2616, 92.4060],
  Dirang:          [27.3478, 92.4797],
  Namdapha:        [27.5511, 96.3898],
  "Sela Pass":     [27.5100, 92.0800],
  Bhalukpong:      [27.0050, 92.6372],
  Pasighat:        [28.0660, 95.3248],

  // Sikkim
  Gangtok:         [27.3314, 88.6138],
  Pelling:         [27.3004, 88.2333],
  Namchi:          [27.1620, 88.3570],
  Lachung:         [27.6870, 88.7445],
  Lachen:          [27.7270, 88.5567],
  "Tsomgo Lake":   [27.3736, 88.7565],
  Tsomgo:          [27.3736, 88.7565],
  "Nathu La":      [27.3872, 88.8283],
  Yuksom:          [27.4060, 88.2354],
  Ravangla:        [27.3044, 88.3585],

  // Other NE
  Kohima:          [25.6701, 94.1077],
  Imphal:          [24.8170, 93.9368],
  Aizawl:          [23.7271, 92.7176],
  Agartala:        [23.8315, 91.2868],
  Silchar:         [24.8333, 92.7789],
  Kaziranga:       [26.5775, 93.1711],
  Majuli:          [26.9524, 94.1619],
  Haflong:         [25.1645, 93.0167],

  // Major Indian cities (origin)
  Mumbai:          [19.0760, 72.8777],
  Delhi:           [28.6139, 77.2090],
  "New Delhi":     [28.6139, 77.2090],
  Kolkata:         [22.5726, 88.3639],
  Chennai:         [13.0827, 80.2707],
  Bengaluru:       [12.9716, 77.5946],
  Bangalore:       [12.9716, 77.5946],
  Hyderabad:       [17.3850, 78.4867],
  Ahmedabad:       [23.0225, 72.5714],
  Pune:            [18.5204, 73.8567],
  Jaipur:          [26.9124, 75.7873],
  Lucknow:         [26.8467, 80.9462],
  Bhubaneswar:     [20.2961, 85.8189],
  Siliguri:        [26.7271, 88.3953],
  Bagdogra:        [26.6812, 88.3285],
};

/** Resolves a free-text place name to known coordinates, or null if we don't have a verified match. */
export function resolveCoords(name: string): [number, number] | null {
  const clean = name.split(",")[0]!.trim();
  if (!clean) return null;

  if (CITY_COORDS[clean]) return CITY_COORDS[clean]!;

  const lower = clean.toLowerCase();
  for (const [k, v] of Object.entries(CITY_COORDS)) {
    if (k.toLowerCase() === lower) return v;
  }
  for (const [k, v] of Object.entries(CITY_COORDS)) {
    if (lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)) return v;
  }

  return null;
}
