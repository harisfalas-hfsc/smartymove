/**
 * Server-only admin allowlist. This file must never be imported from
 * client-bundled code — admin emails must not ship in the public bundle.
 */
export const ADMIN_EMAILS = ["harisfalas@gmail.com"];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
