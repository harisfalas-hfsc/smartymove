/** Emails that always get admin + premium access in the app. */
export const ADMIN_EMAILS = [
  "harispalas@gmail.com",
  "harisfalas@gmail.com",
];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}