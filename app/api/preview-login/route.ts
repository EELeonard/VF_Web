import {
  createPreviewToken,
  previewCookie,
  validPreviewCredentials,
} from "../../lib/preview-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    username?: string;
    password?: string;
  };
  if (!validPreviewCredentials(body.username ?? "", body.password ?? "")) {
    return Response.json(
      { error: "Benutzername oder Passwort ist falsch." },
      { status: 401 },
    );
  }

  const token = await createPreviewToken();
  return new Response(JSON.stringify({ authenticated: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": previewCookie(token),
      "cache-control": "no-store",
    },
  });
}
