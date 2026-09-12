import { env } from "cloudflare:workers";
import { getAdminSession } from "../../../lib/admin-auth";

export async function GET(request: Request) {
  const user = await getAdminSession(request, env.DB);
  return Response.json({ authenticated: Boolean(user), user });
}
