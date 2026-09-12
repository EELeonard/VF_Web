import { expiredSessionCookie } from "../../../lib/admin-auth";

export async function POST() {
  return new Response(JSON.stringify({ authenticated: false }), {
    status: 200,
    headers: { "content-type": "application/json", "set-cookie": expiredSessionCookie() },
  });
}
