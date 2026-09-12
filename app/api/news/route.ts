import { env } from "cloudflare:workers";
import { ensureAdminDatabase, type NewsPost } from "../../lib/admin-db";

export async function GET() {
  const db = await ensureAdminDatabase(env.DB);
  const result = await db.prepare("SELECT id, title_de, title_en, excerpt_de, excerpt_en, link_url, link_label_de, link_label_en, starts_at, ends_at FROM news_posts WHERE status = 'published' AND (starts_at IS NULL OR datetime(starts_at) <= datetime('now')) AND (ends_at IS NULL OR datetime(ends_at) >= datetime('now')) ORDER BY COALESCE(starts_at, created_at) DESC, id DESC LIMIT 6").all<NewsPost>();
  return Response.json({ posts: result.results }, { headers: { "cache-control": "no-store" } });
}
