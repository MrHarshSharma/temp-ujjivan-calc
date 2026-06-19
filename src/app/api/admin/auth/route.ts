// F-12: validate the admin password. The client keeps it in memory and sends it
// as x-admin-token on privileged requests.
export async function POST(req: Request) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) {
    return Response.json({ error: 'Admin access not configured. Set ADMIN_PASSWORD.' }, { status: 503 })
  }
  let body: { password?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  if (body.password !== expected) {
    return Response.json({ ok: false }, { status: 401 })
  }
  return Response.json({ ok: true })
}
