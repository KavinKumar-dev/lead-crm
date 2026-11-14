/**
 * Shared helpers for the auto-generated follow-up notes.
 *
 * Notes are built from a fixed prefix plus optional free text, so they can
 * end up with a dangling separator (" - ") or trailing whitespace. These
 * helpers keep them tidy.
 */

/**
 * Trim a note and remove a dangling separator at the end.
 *
 * "Lead Lost: No Response - "  ->  "Lead Lost: No Response"
 */
export function cleanNote(note: string | null | undefined): string {
  if (!note) return "";
  return note
    .trim()
    .replace(/\s*-\s*$/, "")
    .trim();
}

/**
 * Build a history note from a prefix and an optional free-text detail.
 *
 * The " - " separator is only added when the detail actually exists, so the
 * note never ends with a dangling dash:
 *
 * buildNote("Lead Lost: No Response")               -> "Lead Lost: No Response"
 * buildNote("Lead Lost: No Response", "")           -> "Lead Lost: No Response"
 * buildNote("Lead Lost: No Response", "Called twice") -> "Lead Lost: No Response - Called twice"
 */
export function buildNote(
  prefix: string,
  detail?: string | null
): string {
  const base = prefix.trim();
  const extra = (detail ?? "").trim();
  return extra ? `${base} - ${extra}` : base;
}
