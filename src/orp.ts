/**
 * Calculates the Optimal Recognition Point (ORP) index for a word.
 *
 * The ORP is the character that, when fixated by the eye, enables the fastest
 * word recognition. It sits at roughly 30% into the word. For short words
 * (1-2 chars) the first character is always used as the anchor.
 */
export function calculateOrp(word: string): number {
  if (word.length <= 2) return 0;
  return Math.floor(word.length * 0.3);
}