/**
 * Simple deprecation helper for Cloakscreen
 * Minimal implementation that can be expanded when needed
 */

const warned = new Set<string>();

/**
 * Show a deprecation warning (only once per feature)
 */
export function deprecate(feature: string, alternative: string): void {
  if (warned.has(feature)) return;
  warned.add(feature);
  console.warn(`[DEPRECATION] ${feature} is deprecated. Use ${alternative} instead.`);
}

/**
 * Clear shown warnings (useful for testing)
 */
export function clearDeprecationWarnings(): void {
  warned.clear();
}
