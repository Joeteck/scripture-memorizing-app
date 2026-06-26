import { BibleApiResult } from "@/types";

const BASE = process.env.EXPO_PUBLIC_BIBLE_API_BASE || "https://bible-api.com";

/**
 * Fetches verse text by a human reference like "John 1:1" or "Romans 8:28-29".
 * bible-api.com needs no key and defaults to the World English Bible (web);
 * pass translation="kjv" for King James, etc.
 */
export async function fetchVerse(
  reference: string,
  translation: string = "kjv"
): Promise<BibleApiResult> {
  const url = `${BASE}/${encodeURIComponent(reference)}?translation=${translation}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Could not find "${reference}". Check the reference and try again.`);
  }

  const data = await res.json();

  if (!data?.text) {
    throw new Error(`No verse text returned for "${reference}".`);
  }

  return {
    reference: data.reference || reference,
    text: String(data.text).trim().replace(/\n+/g, " "),
    translation: (data.translation_id || translation).toUpperCase(),
  };
}
