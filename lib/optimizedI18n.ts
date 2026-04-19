import { translations, Language } from "./i18n";

/**
 * Pre-compute all translation paths at module load time.
 * Flattens nested translation objects into dot-notation keys.
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
 * Get a translation value using a pre-flattened lookup.
 * O(1) lookup time — flattenedTranslations is already a flat Record<string, string>.
 *
 * @param language - Current language code
 * @param path - Dot-notation path (e.g., "common.browse")
 * @returns Translated string or the path if not found
 */
export function getTranslation(language: Language, path: string): string {
  return flattenedTranslations[language]?.[path] ?? path;
}

/**
 * Create an optimized translation function for a specific language.
 * Returns a function that uses pre-flattened lookups.
 */
export function createTranslator(language: Language): (path: string) => string {
  return (path: string) => getTranslation(language, path);
}
