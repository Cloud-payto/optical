/**
 * Spacing constants for consistent UI spacing across the OptiProfit application
 * Based on Tailwind's 4px spacing scale
 */

export const SPACING = {
  // Section spacing (between major content blocks)
  section: 'mb-8',           // 32px - standard section spacing
  sectionLarge: 'mb-12',     // 48px - hero sections and major dividers only
  
  // Container padding (main content areas)
  container: 'p-6 md:p-8',   // 24px mobile, 32px desktop
  
  // Component padding
  card: 'p-6',               // 24px - standard card padding
  cardSmall: 'p-4',          // 16px - compact card padding
  cardLarge: 'p-8',          // 32px - large card padding
  
  // Grid and layout gaps
  grid: 'gap-4 md:gap-6',    // 16px mobile, 24px desktop
  gridLarge: 'gap-6 md:gap-8', // 24px mobile, 32px desktop
  
  // Element spacing
  element: 'mb-4',           // 16px - between related elements
  elementSmall: 'mb-2',      // 8px - tight element spacing
  elementLarge: 'mb-6',      // 24px - loose element spacing
} as const;

/**
 * Responsive padding patterns for consistent responsive behavior
 */
export const RESPONSIVE_PADDING = {
  // Standard page padding
  page: 'p-6 md:p-8',
  
  // Container padding with responsive breakpoints
  container: 'px-4 sm:px-6 lg:px-8',
  
  // Form and input padding
  input: 'px-3 py-2',
  inputLarge: 'px-4 py-3',
  
  // Button padding
  buttonSmall: 'px-3 py-1.5',
  button: 'px-4 py-2',
  buttonLarge: 'px-6 py-3',
} as const;

/**
 * Common spacing utility combinations
 */
export const SPACING_COMBOS = {
  // Standard page wrapper
  pageWrapper: 'h-full bg-gray-50',
  pageContent: `${SPACING.container}`,
  
  // Section headers
  sectionHeader: `${SPACING.element}`,
  
  // Card layouts
  cardContainer: `${SPACING.card} rounded-lg shadow-sm`,
  cardHeader: `${SPACING.elementLarge}`,
} as const;

export type SpacingKey = keyof typeof SPACING;
export type ResponsivePaddingKey = keyof typeof RESPONSIVE_PADDING;
export type SpacingComboKey = keyof typeof SPACING_COMBOS;