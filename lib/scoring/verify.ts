export type Sentence = { text: string; start: number; end: number };

export function normalise(text: string): string {
  return text.normalize("NFKC").replace(/\s+/g, " ").trim();
}

/**
 * A quote only counts if it appears, unchanged, in the student's own work.
 * Offsets refer to the normalised text.
 */
export function findQuote(
  body: string,
  quote: string,
): { start: number; end: number } | null {
  const normalisedBody = normalise(body);
  const normalisedQuote = normalise(quote);
  if (!normalisedQuote) return null;

  const start = normalisedBody.indexOf(normalisedQuote);
  if (start < 0) return null;
  return { start, end: start + normalisedQuote.length };
}

export function extractSentences(body: string): Sentence[] {
  const sentences: Sentence[] = [];
  const pattern = /[^.!?\n]+[.!?]*/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(body)) !== null) {
    const raw = match[0];
    const leading = raw.length - raw.trimStart().length;
    const text = raw.trim();
    if (text.length < 8) continue;
    sentences.push({
      text,
      start: match.index + leading,
      end: match.index + leading + text.length,
    });
  }

  return sentences;
}

export function numbersIn(text: string): number[] {
  const matches = text.match(/\d[\d,]*(?:\.\d+)?/g) ?? [];
  return matches
    .map((value) => Number(value.replace(/,/g, "")))
    .filter((value) => Number.isFinite(value));
}

export function hasAny(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
}

/** Sentences a student might actually write; used to build evidence quotes. */
export function sentenceWith(text: string, terms: string[]): string | null {
  const sentences = extractSentences(text);
  const hit = sentences.find((sentence) => hasAny(sentence.text, terms));
  return hit?.text ?? sentences[0]?.text ?? null;
}
