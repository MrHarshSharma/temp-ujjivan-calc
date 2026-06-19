/** Simple admin gate: compares the x-admin-token header to ADMIN_PASSWORD. */
export function isAdmin(req: Request): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  return req.headers.get('x-admin-token') === expected
}
