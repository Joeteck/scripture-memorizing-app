// lib/bibleApi.ts
import { BibleApiResult } from "@/types";
import { logError } from "@/lib/monitoring";

// bolls.life API base URL
const BASE = "https://bolls.life";

// Standard 66-book canon order
const BOOKS: { id: number; display: string; names: string[] }[] = [
  { id: 1, display: "Genesis", names: ["genesis", "gen"] },
  { id: 2, display: "Exodus", names: ["exodus", "exo", "ex"] },
  { id: 3, display: "Leviticus", names: ["leviticus", "lev"] },
  { id: 4, display: "Numbers", names: ["numbers", "num"] },
  { id: 5, display: "Deuteronomy", names: ["deuteronomy", "deut", "deu"] },
  { id: 6, display: "Joshua", names: ["joshua", "josh", "jos"] },
  { id: 7, display: "Judges", names: ["judges", "judg", "jdg"] },
  { id: 8, display: "Ruth", names: ["ruth", "rut"] },
  { id: 9, display: "1 Samuel", names: ["1 samuel", "1samuel", "1 sam", "i samuel"] },
  { id: 10, display: "2 Samuel", names: ["2 samuel", "2samuel", "2 sam", "ii samuel"] },
  { id: 11, display: "1 Kings", names: ["1 kings", "1kings", "1 ki", "i kings"] },
  { id: 12, display: "2 Kings", names: ["2 kings", "2kings", "2 ki", "ii kings"] },
  { id: 13, display: "1 Chronicles", names: ["1 chronicles", "1chronicles", "1 chron", "1 chr"] },
  { id: 14, display: "2 Chronicles", names: ["2 chronicles", "2chronicles", "2 chron", "2 chr"] },
  { id: 15, display: "Ezra", names: ["ezra"] },
  { id: 16, display: "Nehemiah", names: ["nehemiah", "neh"] },
  { id: 17, display: "Esther", names: ["esther", "esth", "est"] },
  { id: 18, display: "Job", names: ["job"] },
  { id: 19, display: "Psalms", names: ["psalms", "psalm", "ps", "psa"] },
  { id: 20, display: "Proverbs", names: ["proverbs", "prov", "pro"] },
  { id: 21, display: "Ecclesiastes", names: ["ecclesiastes", "eccl", "ecc"] },
  { id: 22, display: "Song of Solomon", names: ["song of solomon", "song of songs", "songs", "sos"] },
  { id: 23, display: "Isaiah", names: ["isaiah", "isa"] },
  { id: 24, display: "Jeremiah", names: ["jeremiah", "jer"] },
  { id: 25, display: "Lamentations", names: ["lamentations", "lam"] },
  { id: 26, display: "Ezekiel", names: ["ezekiel", "ezek", "eze"] },
  { id: 27, display: "Daniel", names: ["daniel", "dan"] },
  { id: 28, display: "Hosea", names: ["hosea", "hos"] },
  { id: 29, display: "Joel", names: ["joel"] },
  { id: 30, display: "Amos", names: ["amos"] },
  { id: 31, display: "Obadiah", names: ["obadiah", "obad", "oba"] },
  { id: 32, display: "Jonah", names: ["jonah", "jon"] },
  { id: 33, display: "Micah", names: ["micah", "mic"] },
  { id: 34, display: "Nahum", names: ["nahum", "nah"] },
  { id: 35, display: "Habakkuk", names: ["habakkuk", "hab"] },
  { id: 36, display: "Zephaniah", names: ["zephaniah", "zeph", "zep"] },
  { id: 37, display: "Haggai", names: ["haggai", "hag"] },
  { id: 38, display: "Zechariah", names: ["zechariah", "zech", "zec"] },
  { id: 39, display: "Malachi", names: ["malachi", "mal"] },
  { id: 40, display: "Matthew", names: ["matthew", "matt", "mat"] },
  { id: 41, display: "Mark", names: ["mark", "mar", "mrk"] },
  { id: 42, display: "Luke", names: ["luke", "luk"] },
  { id: 43, display: "John", names: ["john", "jhn"] },
  { id: 44, display: "Acts", names: ["acts", "act"] },
  { id: 45, display: "Romans", names: ["romans", "rom"] },
  { id: 46, display: "1 Corinthians", names: ["1 corinthians", "1corinthians", "1 cor"] },
  { id: 47, display: "2 Corinthians", names: ["2 corinthians", "2corinthians", "2 cor"] },
  { id: 48, display: "Galatians", names: ["galatians", "gal"] },
  { id: 49, display: "Ephesians", names: ["ephesians", "eph"] },
  { id: 50, display: "Philippians", names: ["philippians", "phil", "php"] },
  { id: 51, display: "Colossians", names: ["colossians", "col"] },
  { id: 52, display: "1 Thessalonians", names: ["1 thessalonians", "1thessalonians", "1 thess", "1 th"] },
  { id: 53, display: "2 Thessalonians", names: ["2 thessalonians", "2thessalonians", "2 thess", "2 th"] },
  { id: 54, display: "1 Timothy", names: ["1 timothy", "1timothy", "1 tim"] },
  { id: 55, display: "2 Timothy", names: ["2 timothy", "2timothy", "2 tim"] },
  { id: 56, display: "Titus", names: ["titus", "tit"] },
  { id: 57, display: "Philemon", names: ["philemon", "phlm", "phm"] },
  { id: 58, display: "Hebrews", names: ["hebrews", "heb"] },
  { id: 59, display: "James", names: ["james", "jas", "jam"] },
  { id: 60, display: "1 Peter", names: ["1 peter", "1peter", "1 pet", "1 pe"] },
  { id: 61, display: "2 Peter", names: ["2 peter", "2peter", "2 pet", "2 pe"] },
  { id: 62, display: "1 John", names: ["1 john", "1john", "1 jn"] },
  { id: 63, display: "2 John", names: ["2 john", "2john", "2 jn"] },
  { id: 64, display: "3 John", names: ["3 john", "3john", "3 jn"] },
  { id: 65, display: "Jude", names: ["jude", "jud"] },
  { id: 66, display: "Revelation", names: ["revelation", "revelations", "rev"] },
];

const BOOK_LOOKUP: Record<string, { id: number; display: string }> = {};
for (const book of BOOKS) {
  for (const alias of book.names) {
    BOOK_LOOKUP[alias] = { id: book.id, display: book.display };
  }
}

function normalizeBookName(s: string): string {
  return s.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<S>\d+<\/S>/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

interface ParsedReference {
  bookId: number;
  bookDisplay: string;
  chapter: number;
  verse: number;
}

function parseReference(reference: string): ParsedReference {
  const match = reference
    .trim()
    .match(/^(.+?)\s+(\d+):(\d+)/);

  if (!match) {
    throw new Error(`Invalid format. Please use "Book Chapter:Verse" (e.g., "John 3:16")`);
  }

  const [, rawBook, chapterStr, verseStr] = match;
  const normalizedBook = normalizeBookName(rawBook);
  const book = BOOK_LOOKUP[normalizedBook];

  if (!book) {
    throw new Error(`Unknown book "${rawBook.trim()}". Try the full name, e.g. "Romans".`);
  }

  return {
    bookId: book.id,
    bookDisplay: book.display,
    chapter: parseInt(chapterStr, 10),
    verse: parseInt(verseStr, 10),
  };
}

// Known working translations for bolls.life
const SUPPORTED_TRANSLATIONS = ['KJV', 'NKJV', 'ESV', 'NIV', 'YLT', 'ASV', 'WEB'];

/**
 * Fetches a single verse OR verse range from bolls.life API
 * Automatically detects if it's a range (e.g., "Romans 5:1-2") or single verse
 * 
 * @param reference - The verse reference (e.g., "John 3:16" or "Romans 5:1-2")
 * @param translation - The translation (e.g., "KJV")
 * @returns The verse text (concatenated for ranges)
 */
export async function fetchVerse(
  reference: string,
  translation: string = "KJV"
): Promise<BibleApiResult> {
  if (__DEV__) console.log(`[BibleAPI] fetchVerse called with reference="${reference}", translation="${translation}"`);
  
  const code = translation.toUpperCase();

  if (!SUPPORTED_TRANSLATIONS.includes(code)) {
    throw new Error(`Translation "${code}" is not supported. Available: ${SUPPORTED_TRANSLATIONS.join(', ')}`);
  }

  // Check if it's a range (e.g., "Romans 5:1-2")
  const rangeMatch = reference.trim().match(/^(.+?)\s+(\d+):(\d+)-(\d+)$/);
  
  if (rangeMatch) {
    // It's a range - fetch all verses individually
    if (__DEV__) console.log(`[BibleAPI] Detected verse range, fetching individually`);
    return fetchVerseRange(reference, translation);
  }

  // Single verse
  return fetchSingleVerse(reference, translation);
}

/**
 * Fetches a single verse from the API
 */
async function fetchSingleVerse(
  reference: string,
  translation: string = "KJV"
): Promise<BibleApiResult> {
  const code = translation.toUpperCase();
  const parsed = parseReference(reference);
  const url = `${BASE}/get-verse/${code}/${parsed.bookId}/${parsed.chapter}/${parsed.verse}/`;
  if (__DEV__) console.log(`[BibleAPI] Fetching URL: ${url}`);

  try {
    const response = await fetch(url);
    if (__DEV__) console.log(`[BibleAPI] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      logError(new Error(`Bible API returned ${response.status}`), {
        reference,
        translation: code,
        body: errorText,
      });
      
      if (response.status === 404) {
        throw new Error(`Verse "${parsed.bookDisplay} ${parsed.chapter}:${parsed.verse}" not found in ${code}.`);
      }
      throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch verse.'}`);
    }

    const data = await response.json();
    if (__DEV__) console.log(`[BibleAPI] Response data keys:`, Object.keys(data));

    if (!data || typeof data !== 'object') {
      throw new Error(`Invalid response format for "${reference}" in ${code}.`);
    }

    const verseText = data.text || data.verse_text || data.verse;
    
    if (!verseText || typeof verseText !== 'string' || !verseText.trim()) {
      logError(new Error("Bible API response had no verse text"), { reference, translation: code });
      throw new Error(`No verse text returned for "${reference}" in ${code}.`);
    }

    const result = {
      reference: `${parsed.bookDisplay} ${parsed.chapter}:${parsed.verse}`,
      text: stripHtml(verseText),
      translation: code,
    };
    
    if (__DEV__) console.log(`[BibleAPI] Success:`, result.reference);
    return result;

  } catch (error) {
    // parseReference's validation errors (bad format, unknown book) never
    // reach this catch — they throw before the try block above — so
    // everything here is a genuine network/API failure worth tracking.
    logError(error, { reference, translation: code });
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch verse: Unknown error`);
  }
}

/**
 * Fetches a range of verses by fetching each verse individually
 * This is more reliable than the batch endpoint which has inconsistent response formats
 * 
 * @param reference - The verse range (e.g., "Romans 5:1-2")
 * @param translation - The translation (e.g., "KJV")
 * @returns Concatenated verse text
 */
export async function fetchVerseRange(
  reference: string,
  translation: string = "KJV"
): Promise<BibleApiResult> {
  if (__DEV__) console.log(`[BibleAPI] fetchVerseRange: "${reference}", ${translation}`);
  
  const rangeMatch = reference.trim().match(/^(.+?)\s+(\d+):(\d+)-(\d+)$/);
  
  if (!rangeMatch) {
    // Not a range, fall back to single verse
    return fetchSingleVerse(reference, translation);
  }

  const [, book, chapter, startVerse, endVerse] = rangeMatch;
  const code = translation.toUpperCase();
  
  if (!SUPPORTED_TRANSLATIONS.includes(code)) {
    throw new Error(`Translation "${code}" is not supported.`);
  }

  const normalizedBook = normalizeBookName(book);
  const bookData = BOOK_LOOKUP[normalizedBook];
  
  if (!bookData) {
    throw new Error(`Unknown book "${book}".`);
  }

  const start = parseInt(startVerse, 10);
  const end = parseInt(endVerse, 10);
  const chapterNum = parseInt(chapter, 10);
  
  if (start >= end) {
    throw new Error(`Invalid verse range: start (${start}) must be less than end (${end}).`);
  }
  
  // Limit range to prevent abuse (max 10 verses per range)
  if (end - start > 9) {
    throw new Error(`Verse range too large. Maximum 10 verses allowed per range.`);
  }
  
  if (__DEV__) console.log(`[BibleAPI] Range: ${bookData.display} ${chapterNum}:${start}-${end}`);
  if (__DEV__) console.log(`[BibleAPI] Fetching ${end - start + 1} verses individually...`);
  
  const verseTexts: string[] = [];
  
  for (let v = start; v <= end; v++) {
    try {
      const singleRef = `${book} ${chapter}:${v}`;
      if (__DEV__) console.log(`[BibleAPI] Fetching verse ${v}/${end}...`);
      const result = await fetchSingleVerse(singleRef, translation);
      verseTexts.push(result.text);
    } catch (e) {
      logError(e, { where: "fetchVerseRange", verse: v, reference });
      // Don't fail the whole range if one verse fails
      verseTexts.push(`[Verse ${v} unavailable]`);
    }
  }
  
  // Filter out unavailable verses
  const validTexts = verseTexts.filter(t => !t.startsWith('[Verse'));
  
  if (validTexts.length === 0) {
    throw new Error(`No verse text returned for range "${reference}" in ${code}.`);
  }
  
  const concatenatedText = verseTexts.join('\n');
  
  const result = {
    reference: `${bookData.display} ${chapterNum}:${start}-${end}`,
    text: concatenatedText,
    translation: code,
  };
  
  if (__DEV__) console.log(`[BibleAPI] Range fetch success: ${result.reference} (${validTexts.length}/${verseTexts.length} verses)`);
  if (__DEV__) console.log(`[BibleAPI] Text preview: "${result.text.substring(0, 100)}..."`);
  return result;
}

/**
 * Validates a reference format (works with both single verses and ranges)
 */
export function validateReference(reference: string): { 
  valid: boolean; 
  error?: string;
  parsed?: { book: string; chapter: number; verse: number; endVerse?: number };
} {
  try {
    // Check if it's a range
    const rangeMatch = reference.trim().match(/^(.+?)\s+(\d+):(\d+)-(\d+)$/);
    
    if (rangeMatch) {
      const [, book, chapter, startVerse, endVerse] = rangeMatch;
      const normalizedBook = normalizeBookName(book);
      const bookData = BOOK_LOOKUP[normalizedBook];
      
      if (!bookData) {
        return { valid: false, error: `Unknown book "${book.trim()}".` };
      }
      
      const start = parseInt(startVerse, 10);
      const end = parseInt(endVerse, 10);
      
      if (start >= end) {
        return { valid: false, error: "Start verse must be less than end verse." };
      }
      
      if (end - start > 9) {
        return { valid: false, error: "Maximum 10 verses per range." };
      }
      
      return {
        valid: true,
        parsed: {
          book: bookData.display,
          chapter: parseInt(chapter, 10),
          verse: start,
          endVerse: end,
        }
      };
    }
    
    // Single verse
    const parsed = parseReference(reference);
    return { 
      valid: true, 
      parsed: {
        book: parsed.bookDisplay,
        chapter: parsed.chapter,
        verse: parsed.verse,
      }
    };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid reference format' 
    };
  }
}

/**
 * Helper to get book ID from name
 */
export function getBookId(bookName: string): number | null {
  const normalized = normalizeBookName(bookName);
  const book = BOOK_LOOKUP[normalized];
  return book ? book.id : null;
}

/**
 * Helper to get book display name from ID
 */
export function getBookDisplay(bookId: number): string | null {
  const book = BOOKS.find(b => b.id === bookId);
  return book ? book.display : null;
}

/**
 * Get available translations
 */
export function getAvailableTranslations(): string[] {
  return SUPPORTED_TRANSLATIONS;
}