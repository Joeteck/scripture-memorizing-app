// src/lib/quiz.ts
//
// Pure logic for the "Test Yourself" word-bank quiz — no React, no
// storage, just: given a verse's text, decide which words to blank and
// build a shuffled bank of tappable word chips (the real answers plus a
// few decoys) to fill them in with. Kept separate from app/quiz.tsx so
// the blanking/scoring rules can be unit-tested or tuned without
// touching any UI.
//
// Design choice: each "word" is the whitespace-delimited token exactly
// as it appears in the verse, punctuation included (e.g. "God," not
// "God"). Blanking and comparison both operate on that same token, just
// normalized (lowercased, punctuation-stripped) for comparison — this
// keeps the chip label, the blank, and the answer check all using one
// consistent unit instead of juggling three different representations.

export interface QuizToken {
  /** Index into the original word list — stable identity for a token. */
  index: number;
  /** The token as it appears in the verse, e.g. "God," or "beginning". */
  display: string;
}

export interface WordBankQuiz {
  /** Every word in the verse, in order. Non-blank tokens are shown as-is. */
  tokens: QuizToken[];
  /** Indices (into `tokens`) that are blanked and must be filled in. */
  blankIndices: number[];
  /** Shuffled chips to fill blanks with — the correct answers + decoys. */
  bank: QuizToken[];
}

function normalize(word: string): string {
  return word.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Builds a word-bank quiz from a verse's text. Deterministic given a
 * fixed Math.random seed isn't guaranteed (no seeding), so each call
 * produces a fresh shuffle/blank selection — intentional, so testing the
 * same verse twice doesn't feel identical.
 */
export function generateWordBankQuiz(verseText: string): WordBankQuiz {
  const words = verseText.trim().split(/\s+/).filter(Boolean);

  const tokens: QuizToken[] = words.map((display, index) => ({ index, display }));

  // Prefer blanking "substantive" words (3+ letters after stripping
  // punctuation) — blanking "a"/"of"/"is" makes for an awkward, not very
  // meaningful quiz and gives the word bank a lot of near-identical short
  // filler chips. Fall back to all words if the verse is too short to
  // have enough of those.
  const substantive = tokens.filter((t) => normalize(t.display).length >= 3);
  const candidates = substantive.length >= 3 ? substantive : tokens;

  // Roughly a third of eligible words, bounded so short verses still get
  // at least a couple of blanks and long verses don't turn into a wall
  // of blanks.
  const targetBlanks = Math.round(candidates.length * 0.35);
  const blankCount = Math.max(2, Math.min(8, targetBlanks, candidates.length));

  // Spread blanks out rather than letting them cluster (e.g. avoid
  // blanking three words in a row, which makes the sentence unreadable
  // and the quiz more about guessing sequence than recalling words).
  const chosen: QuizToken[] = [];
  const shuffledCandidates = shuffle(candidates);
  for (const token of shuffledCandidates) {
    if (chosen.length >= blankCount) break;
    const tooClose = chosen.some((c) => Math.abs(c.index - token.index) < 2);
    if (!tooClose) chosen.push(token);
  }
  // If spacing constraints left us short (very dense candidate list),
  // fill the remainder ignoring the spacing rule rather than under-blank.
  if (chosen.length < blankCount) {
    for (const token of shuffledCandidates) {
      if (chosen.length >= blankCount) break;
      if (!chosen.includes(token)) chosen.push(token);
    }
  }

  const blankIndices = chosen.map((t) => t.index).sort((a, b) => a - b);
  const blankIndexSet = new Set(blankIndices);

  // Decoys: other words from the same verse that weren't blanked. Using
  // real words from the verse (rather than an unrelated wordlist) keeps
  // every option plausible in context instead of an obvious wrong answer.
  const decoyPool = shuffle(
    tokens.filter((t) => !blankIndexSet.has(t.index))
  );
  const decoyCount = Math.min(4, decoyPool.length);
  const decoys = decoyPool.slice(0, decoyCount);

  const bank = shuffle([...chosen, ...decoys]);

  return { tokens, blankIndices, bank };
}

/** Case/punctuation-insensitive comparison used to grade a placed chip. */
export function tokensMatch(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}
