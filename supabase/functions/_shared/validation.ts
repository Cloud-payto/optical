/**
 * Request Validation Utilities
 *
 * Common validation functions for Supabase Edge Functions
 */

/**
 * Validates a UUID string
 * @param uuid - The UUID string to validate
 * @returns true if valid UUID v4, false otherwise
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates session ID and returns it or throws error
 * @param sessionId - The session ID to validate
 * @returns The validated session ID
 * @throws Error if invalid
 */
export function requireValidSessionId(sessionId: string | null): string {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }

  if (!validateUUID(sessionId)) {
    throw new Error('Invalid session ID format');
  }

  return sessionId;
}
