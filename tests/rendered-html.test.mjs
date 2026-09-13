import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", String(Date.now()));
  const { default: worker } = await import(workerUrl.href);
  const environment = {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  };
  const context = { waitUntil() {}, passThroughOnException() {} };
  const login = await worker.fetch(
    new Request("http://localhost/api/preview-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "Viennaflight" }),
    }),
    environment,
    context,
  );
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
  assert.ok(cookie);
  return worker.fetch(
    new Request("http://localhost" + pathname, {
      headers: { accept: "text/html", cookie },
    }),
    environment,
    context,
  );
}

test("requires preview authentication across the site", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("gate-test", String(Date.now()));
  const { default: worker } = await import(workerUrl.href);
  const environment = {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  };
  const context = { waitUntil() {}, passThroughOnException() {} };
  const response = await worker.fetch(
    new Request("http://localhost/simulatoren"),
    environment,
    context,
  );
  assert.equal(response.status, 307);
  assert.equal(
    response.headers.get("location"),
    "/preview-login?returnTo=%2Fsimulatoren",
  );
});

test("server renders the Vienna Flight experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Vienna Flight \| Flugsimulatorzentrum Wien<\/title>/i);
  assert.match(html, /Einsteigen/);
  assert.match(html, /Airbus A320/);
  assert.match(html, /Kalender öffnen/);
  assert.match(html, /\/buchen/);
  assert.match(html, /Fly your event/);
  assert.match(html, /Bereit fürs Screening/);
  assert.match(html, /Schönngasse 15-17/);
  assert.match(html, /property="og:image"/);
  assert.match(html, /https:\/\/viennaflight\.at\/og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|SkeletonPreview/);
});

test("includes accessible booking controls and reduced motion styling", async () => {
  const response = await render("/buchen");
  const html = await response.text();
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(html, /aria-label="Hauptnavigation"/);
  assert.match(html, /type="email"/);
  assert.match(html, /type="tel"/);
  assert.match(html, /required=""/);
  assert.doesNotMatch(html, /Der vollständige Kalender zeigt alle vom Team freigeschalteten Termine/);
  assert.match(html, /Vorheriger Monat/);
  assert.match(html, /Nächster Monat/);
  assert.match(html, /calendar-grid/);
  assert.match(css, /prefers-reduced-motion/);
});

test("serves all primary pages", async () => {
  const pages = [
    ["/simulatoren", /Vier Cockpits/],
    ["/erlebnisse", /Erlebnisse, die/],
    ["/ueber-uns", /Aus Leidenschaft/],
    ["/kontakt", /Wir freuen uns/],
    ["/events", /Gemeinsam/],
    ["/screening", /Simulator Screening/],
    ["/impressum", /FN 370636 d/],
    ["/datenschutz", /Recht auf Löschung/],
    ["/admin", /Sitzung wird geprüft/],
    ["/admin/news", /Sitzung wird geprüft/],
    ["/admin/users", /Sitzung wird geprüft/],
    ["/admin/vouchers", /Sitzung wird geprüft/],
  ];
  for (const [path, expected] of pages) {
    const response = await render(path);
    assert.equal(response.status, 200);
    assert.match(await response.text(), expected);
  }
});

test("serves the complete English site", async () => {
  const pages = [
    ["/en", /Step in/],
    ["/en/simulators", /Four cockpits/],
    ["/en/experiences", /experiences/i],
    ["/en/about", /passion/i],
    ["/en/contact", /look forward/i],
    ["/en/events", /together/i],
    ["/en/screening", /Simulator Screening/i],
    ["/en/booking", /Choose your/],
    ["/en/legal-notice", /Company information/],
    ["/en/privacy", /Right to erasure/],
  ];
  for (const [path, expected] of pages) {
    const response = await render(path);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, expected);
    assert.match(html, /Book a flight|Request booking/);
  }
});

test("uses local legal and privacy pages", async () => {
  const german = await (await render("/")).text();
  const english = await (await render("/en")).text();
  assert.match(german, /href="\/impressum"/);
  assert.match(german, /href="\/datenschutz"/);
  assert.doesNotMatch(german, /viennaflight\.at\/impressum/);
  assert.doesNotMatch(german, /viennaflight\.at\/datenschutz/);
  assert.match(english, /href="\/en\/legal-notice"/);
  assert.match(english, /href="\/en\/privacy"/);
});

test("documents explicit appointment release controls", async () => {
  const bookingHtml = await (await render("/en/booking")).text();
  const adminHtml = await (await render("/admin")).text();
  const bookingRoute = await readFile(new URL("../app/api/bookings/route.ts", import.meta.url), "utf8");
  assert.doesNotMatch(bookingHtml, /Only appointments actively released by the Vienna Flight team are shown/);
  assert.match(adminHtml, /Sitzung wird geprüft/);
  assert.match(bookingRoute, /appointment_slots/);
  assert.match(bookingRoute, /enabled = 1/);
  assert.match(bookingRoute, /NOT EXISTS/);
});

test("keeps reveal content visible when client animation is unavailable", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const reveal = await readFile(new URL("../app/components/Reveal.tsx", import.meta.url), "utf8");
  assert.match(css, /\.reveal\s*\{\s*opacity:1;/);
  assert.match(css, /\.reveal\.reveal-pending\s*\{\s*opacity:0;/);
  assert.match(reveal, /MutationObserver/);
  assert.match(reveal, /pageshow/);
  assert.match(reveal, /visibilitychange/);
});

test("links simulator cards to faithful detailed descriptions", async () => {
  const home = await (await render("/")).text();
  const simulators = await (await render("/simulatoren")).text();
  assert.match(home, /href="\/simulatoren#airbus-a320"/);
  assert.match(home, /href="\/simulatoren#boeing-787"/);
  assert.match(home, /href="\/simulatoren#bell-206"/);
  assert.match(home, /href="\/simulatoren#eurofighter"/);
  assert.match(simulators, /95 Prozent Originalteile/);
  assert.match(simulators, /spürbare Vibrationen/);
  assert.match(simulators, /220°-Rundleinwand/);
  assert.match(simulators, /6-DOF-Motion-Plattform/);
});

test("provides controlled news publishing and revocable dashboard users", async () => {
  const german = await (await render("/")).text();
  const english = await (await render("/en")).text();
  const newsApi = await readFile(new URL("../app/api/news/route.ts", import.meta.url), "utf8");
  const usersApi = await readFile(new URL("../app/api/admin/users/route.ts", import.meta.url), "utf8");
  const auth = await readFile(new URL("../app/lib/admin-auth.ts", import.meta.url), "utf8");
  const newsAdmin = await readFile(new URL("../app/admin/news/page.tsx", import.meta.url), "utf8");
  assert.match(german, /NewsSection/);
  assert.match(english, /NewsSection/);
  assert.match(newsApi, /status = 'published'/);
  assert.match(newsApi, /starts_at IS NULL/);
  assert.match(newsApi, /ends_at IS NULL/);
  assert.match(usersApi, /PBKDF2|hashPassword/);
  assert.match(auth, /crypto\.subtle\.verify/);
  assert.match(auth, /active = 1/);
  assert.match(newsAdmin, /aria-label="News veröffentlichen"/);
  assert.match(newsAdmin, /Aktuell sichtbare Inhalte/);
});

test("supports restricted and auditable voucher redemptions", async () => {
  const booking = await (await render("/buchen")).text();
  const englishBooking = await (await render("/en/booking")).text();
  const bookingApi = await readFile(new URL("../app/api/bookings/route.ts", import.meta.url), "utf8");
  const voucherDatabase = await readFile(new URL("../app/lib/vouchers-db.ts", import.meta.url), "utf8");
  assert.match(booking, /Gutscheincode/);
  assert.match(englishBooking, /Voucher code/);
  assert.match(bookingApi, /voucher_redemptions/);
  assert.match(bookingApi, /max_uses_per_email/);
  assert.match(voucherDatabase, /allowed_email/);
  assert.match(voucherDatabase, /customer_email = \?/);
});

test("provides an operational booking workspace and communication archive", async () => {
  const admin = await (await render("/admin")).text();
  const manager = await readFile(new URL("../app/components/BookingManager.tsx", import.meta.url), "utf8");
  const managementApi = await readFile(new URL("../app/api/admin/booking-management/route.ts", import.meta.url), "utf8");
  const notifications = await readFile(new URL("../app/lib/booking-notifications.ts", import.meta.url), "utf8");
  assert.match(admin, /Sitzung wird geprüft/);
  assert.match(manager, /Neuer Terminvorschlag/);
  assert.match(manager, /Interne Anmerkungen/);
  assert.match(manager, /E-Mail-Verlauf/);
  assert.match(managementApi, /status = 'cancelled'/);
  assert.match(managementApi, /direction: "inbound"/);
  assert.match(notifications, /recordCommunication/);
});

test("supports secure password resets and instructor assignment coverage", async () => {
  const users = await readFile(new URL("../app/admin/users/page.tsx", import.meta.url), "utf8");
  const resetApi = await readFile(new URL("../app/api/admin/password-reset/route.ts", import.meta.url), "utf8");
  const admin = await readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8");
  const instructorApi = await readFile(new URL("../app/api/admin/instructors/route.ts", import.meta.url), "utf8");
  const availabilityPage = await readFile(new URL("../app/admin/availability/page.tsx", import.meta.url), "utf8");
  const availabilityApi = await readFile(new URL("../app/api/admin/instructor-availability/route.ts", import.meta.url), "utf8");
  const invitation = await readFile(new URL("../app/lib/user-invitations.ts", import.meta.url), "utf8");
  const manager = await readFile(new URL("../app/components/BookingManager.tsx", import.meta.url), "utf8");
  assert.match(users, /Benutzer hinzufügen/);
  assert.match(users, /Passwort zurücksetzen/);
  assert.match(resetApi, /SHA-256/);
  assert.match(resetApi, /used_at IS NULL/);
  assert.match(resetApi, /60\*60\*1000/);
  assert.match(users, /<option value="editor">Editor/);
  assert.match(users, /<option value="instructor">Instructor/);
  assert.match(users, /Simulator-Berechtigungen/);
  assert.match(users, /member-menu-button/);
  assert.match(invitation, /Benutzername:/);
  assert.match(availabilityPage, /Meine Verfügbarkeit/);
  assert.match(availabilityPage, /Date\.UTC/);
  assert.match(availabilityPage, /getUTCDay/);
  assert.match(availabilityPage, /Ganzer Tag/);
  assert.match(availabilityPage, /Verfügbar ab/);
  assert.match(availabilityPage, /Verfügbar bis/);
  assert.match(availabilityPage, /Zeitfenster speichern/);
  assert.match(availabilityPage, /customRangeSelected/);
  assert.match(availabilityPage, /wholeDaySelected/);
  assert.match(availabilityApi, /mode!=="unavailable"/);
  assert.match(availabilityApi, /session\?\.role!=="instructor"/);
  assert.match(admin, /Verfügbare Instructoren nach Simulator/);
  assert.match(admin, /requiredTimes\.every/);
  assert.match(admin, /assignmentId=/);
  assert.match(admin, /Nicht zugeordnet/);
  assert.match(admin, /session\.user\?\.role !== "instructor"/);
  assert.match(admin, /location\.replace\("\/admin\/availability"\)/);
  assert.match(admin, /Tagesplan mailen/);
  assert.match(instructorApi, /instructor_day_assignments/);
  assert.match(instructorApi, /instructor_capabilities/);
  assert.match(instructorApi, /target\.flight_start_at/);
  assert.match(instructorApi, /instructorIdParam===null/);
  assert.match(manager, /Dieser Termin benötigt noch einen Instructor/);
});
