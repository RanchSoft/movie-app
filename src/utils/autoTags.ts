/** Resolves an ISO 639-1 code (e.g. "fr") to an English display name (e.g. "French") using the browser's built-in locale data — no API call needed. */
export function languageName(code?: string): string | null {
  if (!code) return null
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'language' })
    const name = displayNames.of(code)
    return name && name.toLowerCase() !== code.toLowerCase() ? name : null
  } catch {
    return null
  }
}

function titleCase(s: string): string {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1))
}

/**
 * Builds a list of suggested tags from TMDb details: the film's original language, a
 * "Subtitles" flag when that language isn't English, and its top keywords (TMDb can return
 * dozens for a well-tagged title, so they're capped to keep the tag list from getting noisy).
 */
export function deriveAutoTags(
  details: { originalLanguage?: string; keywords: string[] },
  maxKeywords = 8,
): string[] {
  const tags: string[] = []
  const lang = languageName(details.originalLanguage)
  if (lang) {
    tags.push(lang)
    if (lang.toLowerCase() !== 'english') tags.push('Subtitles')
  }
  for (const keyword of details.keywords.slice(0, maxKeywords)) {
    tags.push(titleCase(keyword))
  }
  return tags
}
