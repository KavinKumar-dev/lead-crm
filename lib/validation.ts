import { ZodError } from "zod";

/**
 * Log a validation failure in the agreed format (flattened field errors) so
 * server logs keep the full picture of what failed.
 */
export function logValidationError(error: ZodError, context?: string) {
  if (context) {
    console.error(`${context} validation error:`, error.flatten());
  } else {
    console.error("validation error:", error.flatten());
  }
}

/**
 * Convert a ZodError into a flat `{ field: message }` map. The first message
 * per field wins, which keeps the inline UI to one message per input.
 */
export function fieldErrors(error: ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

/** Convenience: log + flatten in one call. */
export function toFieldErrors(error: ZodError, context?: string) {
  logValidationError(error, context);
  return fieldErrors(error);
}
