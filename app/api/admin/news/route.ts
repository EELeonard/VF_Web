import { env } from "cloudflare:workers";
import { isValidSession } from "../../../lib/admin-auth";
import { ensureAdminDatabase, type NewsPost, type NewsStatus } from "../../../lib/admin-db";

function clean(body: Record<string, unknown>) {
  return {
    titleDe: String(body.titleDe ?? "").trim(), titleEn: String(body.titleEn ?? "").trim(),
    excerptDe: String(body.excerptDe ?? "").trim(), excerptEn: String(body.excerptEn ?? "").trim(),
    linkUrl: String(body.linkUrl ?? "/buchen").trim(), linkLabelDe: String(body.linkLabelDe ?? "Mehr erfahren").trim(), linkLabelEn: String(body.linkLabelEn ?? "Learn more").trim(),
    status: (body.status === "published" ? "published" : "draft") as NewsStatus,
    startsAt: body.startsAt ? String(body.startsAt) : null, endsAt: body.endsAt ? String(body.endsAt) : null,
  };
}

function invalid(post: ReturnType<typeof clean>) {
  return !post.titleDe || !post.titleEn || !post.excerptDe || !post.excerptEn || !post.linkLabelDe || !post.linkLabelEn || !post.linkUrl.startsWith("/") || post.linkUrl.startsWith("//") || post.titleDe.length > 140 || post.titleEn.length > 140 || post.excerptDe.length > 600 || post.excerptEn.length > 600 || (post.startsAt && post.endsAt && post.startsAt >= post.endsAt);
}

export async function GET(request: Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const db = await ensureAdminDatabase(env.DB);
  const result = await db.prepare("SELECT * FROM news_posts ORDER BY created_at DESC, id DESC").all<NewsPost>();
  return Response.json({ posts: result.results });
}

export async function POST(request: Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const post = clean(await request.json() as Record<string, unknown>);
  if (invalid(post)) return Response.json({ error: "Bitte prüfen Sie Inhalt, Laufzeit und internen Link." }, { status: 400 });
  const db = await ensureAdminDatabase(env.DB);
  const result = await db.prepare("INSERT INTO news_posts (title_de, title_en, excerpt_de, excerpt_en, link_url, link_label_de, link_label_en, status, starts_at, ends_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(post.titleDe, post.titleEn, post.excerptDe, post.excerptEn, post.linkUrl, post.linkLabelDe, post.linkLabelEn, post.status, post.startsAt, post.endsAt).run();
  return Response.json({ created: true, id: result.meta.last_row_id }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const id = Number(body.id);
  const post = clean(body);
  if (!Number.isInteger(id) || invalid(post)) return Response.json({ error: "Ungültige News-Aktualisierung." }, { status: 400 });
  const db = await ensureAdminDatabase(env.DB);
  const result = await db.prepare("UPDATE news_posts SET title_de = ?, title_en = ?, excerpt_de = ?, excerpt_en = ?, link_url = ?, link_label_de = ?, link_label_en = ?, status = ?, starts_at = ?, ends_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(post.titleDe, post.titleEn, post.excerptDe, post.excerptEn, post.linkUrl, post.linkLabelDe, post.linkLabelEn, post.status, post.startsAt, post.endsAt, id).run();
  if (!result.meta.changes) return Response.json({ error: "News-Beitrag nicht gefunden." }, { status: 404 });
  return Response.json({ updated: true });
}

export async function DELETE(request: Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return Response.json({ error: "Ungültiger News-Beitrag." }, { status: 400 });
  const db = await ensureAdminDatabase(env.DB);
  await db.prepare("DELETE FROM news_posts WHERE id = ?").bind(id).run();
  return Response.json({ deleted: true });
}
