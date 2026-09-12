import { env } from "cloudflare:workers";
import { isValidSession } from "../../../lib/admin-auth";
import { processDueReminders } from "../../../lib/booking-notifications";

export async function POST(request: Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  return Response.json(await processDueReminders(new Date(), env.DB, env));
}
