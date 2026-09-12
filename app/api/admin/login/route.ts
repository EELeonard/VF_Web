import { env } from "cloudflare:workers";
import { authenticateAdmin, createSessionToken, sessionCookie } from "../../../lib/admin-auth";

export async function POST(request: Request) {
  const body = await request.json() as { username?: string; password?: string };
  const user = await authenticateAdmin(body.username ?? "", body.password ?? "", env.DB);
  if (!user) {
    return Response.json({ error: "Benutzername oder Passwort ist falsch." }, { status: 401 });
  }
  const token = await createSessionToken(user);
  return new Response(JSON.stringify({ authenticated: true, user }), {
    status: 200,
    headers: { "content-type": "application/json", "set-cookie": sessionCookie(token) },
  });
}
