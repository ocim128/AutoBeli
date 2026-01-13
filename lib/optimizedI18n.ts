import { translations, Language } from "./i18n";

/**
 * Pre-computed translation cache for faster lookups.
 * Flattens nested translation objects into dot-notation keys.
 */
const translationCache = new Map<string, string>();

/**
 * Pre-compute all translation paths at module load time.
 * This eliminates repeated object traversal during translation lookups.
 */
function flattenTranslations(obj: object, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      result[fullKey] = value;
    } else if (typeof value === "object" && value !== null) {
      Object.assign(result, flattenTranslations(value, fullKey));
    }
  }

  return result;
}

// Pre-compute flattened translations for each language
const flattenedTranslations: Record<Language, Record<string, string>> = {
  id: flattenTranslations(translations.id),
  en: flattenTranslations(translations.en),
};

/**
 * Get a translation value using a cached lookup.
 * O(1) lookup time instead of O(n) where n is path depth.
 *
 * @param language - Current language code
 * @param path - Dot-notation path (e.g., "common.browse")
 * @returns Translated string or the path if not found
 */
export function getTranslation(language: Language, path: string): string {
  const cacheKey = `${language}:${path}`;

  // Check cache first
  const cached = translationCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // Lookup from pre-flattened translations
  const value = flattenedTranslations[language][path];

  if (value !== undefined) {
    translationCache.set(cacheKey, value);
    return value;
  }

  // Return path as fallback (matches original behavior)
  return path;
}

/**
 * Create an optimized translation function for a specific language.
 * Returns a memoized function that uses cached lookups.
 */
export function createTranslator(language: Language): (path: string) => string {
  return (path: string) => getTranslation(language, path);
}

/**
 * Preload all translations for a language into cache.
 * Call this during app initialization for maximum performance.
 */
export function preloadTranslations(language: Language): void {
  const flattened = flattenedTranslations[language];
  for (const [path, value] of Object.entries(flattened)) {
    translationCache.set(`${language}:${path}`, value);
  }
}

/**
 * Get cache statistics for debugging.
 */
export function getTranslationCacheStats(): { size: number; entries: string[] } {
  return {
    size: translationCache.size,
    entries: Array.from(translationCache.keys()),
  };
}

// Pre-load both languages at module load time
preloadTranslations("id");
preloadTranslations("en");
