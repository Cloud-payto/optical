/**
 * Brand name mapping from abbreviations to full names
 * Used across the application for displaying proper brand names
 */

export const BRAND_NAME_MAP: Record<string, string> = {
  // Safilo brands
  'CARRERA': 'Carrera',
  'CH': 'Carolina Herrera',
  'CHL': 'Chloé',
  'BOSS': 'Boss',
  'HBOSS': 'Hugo Boss',
  'JC': 'Jimmy Choo',
  'KS': 'Kate Spade',
  'MJ': 'Marc Jacobs',
  'MMAW': 'Max Mara',
  'PLD': 'Polaroid',
  'FOS': 'Fossil',
  'LS': "Levi's",
  'BR': 'Banana Republic',
  'MIS': 'Missoni',
  'BV': 'Bottega Veneta',
  'MOS': 'Moschino',

  // L'amyamerica brands
  '2BB': '2BB',
  'Ann Taylor': 'Ann Taylor',
  'Ben Sherman': 'Ben Sherman',
  "C By L'Amy": "C By L'Amy",
  'Champion': 'Champion',
  'Nicole Miller': 'Nicole Miller',
  'Private Label': 'Private Label',
  'Seven.Five': 'Seven.Five',
  'Sperry': 'Sperry',
  'TLG': 'TLG',
  "Vision's": "Vision's",

  // Luxottica brands
  'RAY-BAN': 'Ray-Ban',
  'OAKLEY': 'Oakley',
  'VOGUE': 'Vogue',
  'PERSOL': 'Persol',
  'ARNETTE': 'Arnette',
  'BURBERRY': 'Burberry',
  'BULGARI': 'Bulgari',
  'CHANEL': 'Chanel',
  'COACH': 'Coach',
  'DOLCE': 'Dolce & Gabbana',
  'EMPORIO': 'Emporio Armani',
  'GIORGIO': 'Giorgio Armani',
  'MICHAEL': 'Michael Kors',
  'PRADA': 'Prada',
  'RALPH': 'Ralph Lauren',
  'TIFFANY': 'Tiffany & Co.',
  'VALENTINO': 'Valentino',
  'VERSACE': 'Versace',

  // Add more as needed
};

/**
 * Get the full brand name from an abbreviation or code
 * Falls back to the original value if no mapping exists
 */
export function getBrandName(brandCode: string): string {
  return BRAND_NAME_MAP[brandCode] || brandCode;
}

/**
 * Get all brand codes for a vendor (for display purposes)
 */
export const VENDOR_BRANDS: Record<string, string[]> = {
  'Safilo': [
    'CARRERA', 'CH', 'CHL', 'BOSS', 'HBOSS', 'JC', 'KS', 'MJ',
    'MMAW', 'PLD', 'FOS', 'LS', 'BR', 'MIS', 'BV', 'MOS'
  ],
  "L'amyamerica": [
    '2BB', 'Ann Taylor', 'Ben Sherman', "C By L'Amy", 'Champion',
    'Nicole Miller', 'Private Label', 'Seven.Five', 'Sperry', 'TLG', "Vision's"
  ]
};
