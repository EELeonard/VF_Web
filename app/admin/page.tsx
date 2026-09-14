"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { BookingRecord, BookingStatus } from "../lib/bookings-db";
import { simulators } from "../lib/site-data";
import { BookingManager } from "../components/BookingManager";
import { AdminNavigation } from "../components/AdminNavigation";
import type {
  Instructor,
  InstructorDayAssignment,
} from "../lib/instructors-db";
import { BOOKING_TIMES } from "../lib/availability-db";
import { bookingFitsAvailability } from "../lib/booking-time";

const statusLabels: Record<BookingStatus, string> = {
  pending: "Offen",
  confirmed: "Bestätigt",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
};

const adminWeekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const adminSlotTimes = [...BOOKING_TIMES];

function monthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function moveMonth(value: string, offset: number) {
  const [year, month] = value.split("-").map(Number);
  return monthKey(new Date(Date.UTC(year, month - 1 + offset, 1)));
}

function calendarDates(value: string) {
  const [year, month] = value.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1, index - mondayOffset + 1));
    return date.toISOString().slice(0, 10);
  });
}

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loginError, setLoginError] = useState("");
  const [dataError, setDataError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | BookingStatus>("all");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [checkingReminders, setCheckingReminders] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => monthKey());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<
    string | null
  >(null);
  const [slotSimulator, setSlotSimulator] = useState(simulators[0].name);
  const [enabledSlots, setEnabledSlots] = useState<Set<string>>(new Set());
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotSaving, setSlotSaving] = useState<string | null>(null);
  const [managedBooking, setManagedBooking] = useState<BookingRecord | null>(
    null,
  );
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [instructorAssignments, setInstructorAssignments] = useState<
    InstructorDayAssignment[]
  >([]);

  useEffect(() => {
    fetch("/api/admin/session", { credentials: "same-origin" })
      .then((response) => response.json())
      .then((data) => {
        if (data.authenticated && data.user?.role === "instructor") {
          window.location.assign("/admin/availability");
          return;
        }
        setAuthenticated(data.authenticated === true);
        if (data.authenticated) {
          void loadBookings();
          void loadInstructorData();
        }
      })
      .catch(() => setDataError("Die Sitzung konnte nicht geprüft werden."))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    const controller = new AbortController();
    fetch(
      `/api/admin/slots?simulator=${encodeURIComponent(slotSimulator)}&month=${calendarMonth}`,
      { credentials: "same-origin", signal: controller.signal },
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.error ?? "Terminfreigaben konnten nicht geladen werden.",
          );
        setEnabledSlots(
          new Set(
            (
              data.slots as Array<{
                flight_date: string;
                flight_time: string;
                enabled: number;
              }>
            )
              .filter((slot) => slot.enabled === 1)
              .map((slot) => `${slot.flight_date}|${slot.flight_time}`),
          ),
        );
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setDataError(
          error instanceof Error
            ? error.message
            : "Terminfreigaben konnten nicht geladen werden.",
        );
      })
      .finally(() => setSlotsLoading(false));
    return () => controller.abort();
  }, [authenticated, calendarMonth, slotSimulator]);

  async function loadBookings() {
    setDataError("");
    const response = await fetch("/api/admin/bookings", {
      credentials: "same-origin",
    });
    if (response.status === 401) {
      setAuthenticated(false);
      return;
    }
    const data = await response.json();
    if (!response.ok) {
      setDataError(data.error ?? "Buchungen konnten nicht geladen werden.");
      return;
    }
    if (data.user?.role === "instructor") {
      window.location.assign("/admin/availability");
      return;
    }
    setBookings(data.bookings);
  }

  async function loadInstructorData() {
    const response = await fetch("/api/admin/instructors", {
        credentials: "same-origin",
      }),
      data = await response.json();
    if (response.ok) {
      setInstructors(data.instructors);
      setInstructorAssignments(data.assignments);
    } else
      setDataError(data.error ?? "Instructoren konnten nicht geladen werden.");
  }

  async function scheduleInstructor(simulator: string, instructorId: string) {
    if (!selectedCalendarDate) return;
    if (!instructorId) {
      const assignment = instructorAssignments.find(
        (item) =>
          item.flight_date === selectedCalendarDate &&
          item.simulator === simulator,
      );
      if (!assignment) return;
      const response = await fetch(
          `/api/admin/instructors?assignmentId=${assignment.id}`,
          { method: "DELETE" },
        ),
        data = await response.json();
      if (response.ok) {
        setNotice(
          `${simulator} ist am ${selectedCalendarDate} nicht mehr zugeordnet.`,
        );
        await Promise.all([loadInstructorData(), loadBookings()]);
      } else setDataError(data.error);
      return;
    }
    const response = await fetch("/api/admin/instructors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          simulator,
          date: selectedCalendarDate,
          instructorId: Number(instructorId),
        }),
      }),
      data = await response.json();
    if (response.ok) {
      setNotice(`${simulator} wurde von ${data.availableFrom} bis ${data.availableUntil} besetzt. ${data.assignedCount} Termin(e) wurden zugeordnet.`);
      await Promise.all([loadInstructorData(), loadBookings()]);
    } else setDataError(data.error);
  }

  async function notifyInstructor(instructorId: number) {
    if (!selectedCalendarDate) return;
    const response = await fetch("/api/admin/instructors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "notify-day",
          date: selectedCalendarDate,
          instructorId,
        }),
      }),
      data = await response.json();
    if (response.ok)
      setNotice(
        `Tagesplan mit ${data.count} Termin(en) wurde per E-Mail versendet.`,
      );
    else setDataError(data.error);
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password"),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setLoginError(data.error ?? "Anmeldung fehlgeschlagen.");
      return;
    }
    if (data.user?.role === "instructor") {
      const sessionResponse = await fetch("/api/admin/session", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const session = await sessionResponse.json();
      if (!sessionResponse.ok || session.user?.role !== "instructor") {
        setLoginError(
          "Die Instructor-Sitzung konnte nicht bestätigt werden. Bitte versuchen Sie es erneut.",
        );
        return;
      }
      window.location.replace("/admin/availability");
      return;
    }
    setAuthenticated(true);
    await loadBookings();
  }

  async function updateStatus(id: number, status: BookingStatus) {
    setSavingId(id);
    setDataError("");
    setNotice("");
    const response = await fetch("/api/admin/bookings", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await response.json();
    if (response.ok) {
      await loadBookings();
      if (status === "confirmed")
        setNotice(
          data.emailSent
            ? "Buchung bestätigt und Bestätigungs-E-Mail versendet."
            : "Buchung bestätigt. Die E-Mail-Zustellung muss geprüft werden.",
        );
    } else {
      setDataError(data.error ?? "Status konnte nicht gespeichert werden.");
    }
    setSavingId(null);
  }

  async function checkReminders() {
    setCheckingReminders(true);
    setDataError("");
    setNotice("");
    const response = await fetch("/api/admin/reminders", {
      method: "POST",
      credentials: "same-origin",
    });
    const data = await response.json();
    if (response.ok) {
      setNotice(
        `${data.checked} fällige Erinnerung(en) geprüft, ${data.sent} versendet, ${data.failed} fehlgeschlagen.`,
      );
      await loadBookings();
    } else
      setDataError(data.error ?? "Erinnerungen konnten nicht geprüft werden.");
    setCheckingReminders(false);
  }

  async function toggleSlot(date: string, time: string) {
    const key = `${date}|${time}`;
    const enabled = !enabledSlots.has(key);
    setSlotSaving(key);
    setDataError("");
    const response = await fetch("/api/admin/slots", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ simulator: slotSimulator, date, time, enabled }),
    });
    const data = await response.json();
    if (response.ok) {
      setEnabledSlots((current) => {
        const next = new Set(current);
        if (enabled) next.add(key);
        else next.delete(key);
        return next;
      });
      setNotice(
        `${slotSimulator}, ${time} Uhr wurde ${enabled ? "freigeschaltet" : "gesperrt"}.`,
      );
    } else
      setDataError(
        data.error ?? "Terminfreigabe konnte nicht geändert werden.",
      );
    setSlotSaving(null);
  }

  async function toggleAllSlots(date: string, enabled: boolean) {
    setSlotSaving("all");
    setDataError("");
    const response = await fetch("/api/admin/slots", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ simulator: slotSimulator, date, enabled, all: true }),
    });
    const data = await response.json();
    if (response.ok) {
      setEnabledSlots((current) => {
        const next = new Set(current);
        for (const time of adminSlotTimes) {
          const key = `${date}|${time}`;
          if (enabled) next.add(key);
          else next.delete(key);
        }
        return next;
      });
      setNotice(`Alle Termine für ${slotSimulator} am ${date} wurden ${enabled ? "freigeschaltet" : "gesperrt"}.`);
    } else setDataError(data.error ?? "Die Tagesfreigabe konnte nicht geändert werden.");
    setSlotSaving(null);
  }

  const visibleBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesStatus = filter === "all" || booking.status === filter;
      const matchesSearch =
        !query ||
        [
          booking.reference,
          booking.customer_name,
          booking.customer_email,
          booking.simulator,
          booking.remark,
        ].some((value) => value.toLowerCase().includes(query));
      const matchesDate =
        !selectedCalendarDate || booking.flight_date === selectedCalendarDate;
      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [bookings, filter, search, selectedCalendarDate]);

  const bookingsByDate = useMemo(() => {
    const grouped = new Map<string, BookingRecord[]>();
    for (const booking of bookings)
      grouped.set(booking.flight_date, [
        ...(grouped.get(booking.flight_date) ?? []),
        booking,
      ]);
    for (const dayBookings of grouped.values())
      dayBookings.sort((a, b) => a.flight_time.localeCompare(b.flight_time));
    return grouped;
  }, [bookings]);

  const adminCalendarDates = useMemo(
    () => calendarDates(calendarMonth),
    [calendarMonth],
  );
  const today = new Date().toISOString().slice(0, 10);
  const selectedDateLabel = selectedCalendarDate
    ? new Date(selectedCalendarDate + "T12:00:00").toLocaleDateString("de-AT", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const counts = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter((booking) => booking.status === "pending")
        .length,
      confirmed: bookings.filter((booking) => booking.status === "confirmed")
        .length,
      upcoming: bookings.filter(
        (booking) =>
          booking.status !== "cancelled" &&
          booking.flight_date >= new Date().toISOString().slice(0, 10),
      ).length,
    }),
    [bookings],
  );

  if (checking)
    return (
      <main className="admin-loading">
        <span className="admin-spinner" />
        <p>Sitzung wird geprüft</p>
      </main>
    );

  if (!authenticated) {
    return (
      <main className="admin-login">
        <section className="login-brand">
          <Link className="brand" href="/">
            <span className="brand-mark">VF</span>
            <span>
              VIENNA <b>FLIGHT</b>
            </span>
          </Link>
          <div>
            <span className="micro-label">Operations Center</span>
            <h1>
              Buchungen
              <br />
              <em>im Blick.</em>
            </h1>
            <p>Geschützter Zugang für das Vienna Flight Team.</p>
          </div>
          <small>© 2026 Vienna Flight</small>
        </section>
        <section className="login-panel">
          <form onSubmit={login}>
            <span className="micro-label">Administration</span>
            <h2>Anmelden</h2>
            <p>Verwenden Sie Ihre Zugangsdaten, um Buchungen zu verwalten.</p>
            <label>
              Benutzername
              <input
                name="username"
                type="text"
                required
                autoComplete="username"
              />
            </label>
            <label>
              Passwort
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </label>
            {loginError && (
              <div className="login-error" role="alert">
                {loginError}
              </div>
            )}
            <button className="button primary" type="submit">
              Sicher anmelden <span>→</span>
            </button>
            <Link href="/">Zur öffentlichen Website</Link>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <AdminNavigation active="bookings" />
      <section className="admin-content">
        <header className="admin-topbar">
          <div>
            <span className="micro-label">Operations Center</span>
            <h1>Buchungen</h1>
          </div>
          <div className="admin-user">
            <span>A</span>
            <div>
              <b>Administrator</b>
              <small>Vienna Flight</small>
            </div>
          </div>
        </header>
        <div className="admin-metrics">
          <article>
            <span>Alle Buchungen</span>
            <strong>{counts.total}</strong>
          </article>
          <article>
            <span>Offene Anfragen</span>
            <strong>{counts.pending}</strong>
          </article>
          <article>
            <span>Bestätigt</span>
            <strong>{counts.confirmed}</strong>
          </article>
          <article>
            <span>Kommende Flüge</span>
            <strong>{counts.upcoming}</strong>
          </article>
        </div>
        <section className="open-requests">
          <header>
            <div>
              <span className="micro-label">Action required</span>
              <h2>Offene Anfragen</h2>
            </div>
            <span>{counts.pending} offen</span>
          </header>
          <div>
            {bookings
              .filter((booking) => booking.status === "pending")
              .slice(0, 6)
              .map((booking) => (
                <article key={booking.id}>
                  <div>
                    <span>{booking.reference}</span>
                    <h3>
                      {booking.simulator} · {booking.customer_name}
                    </h3>
                    <p>
                      {new Date(
                        booking.flight_date + "T12:00:00",
                      ).toLocaleDateString("de-AT")}{" "}
                      · {booking.flight_time} Uhr
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setManagedBooking(booking)}
                  >
                    Anfrage öffnen
                  </button>
                </article>
              ))}
            {counts.pending === 0 && (
              <div className="open-requests-empty">
                <span>✓</span>
                <p>Alle Anfragen sind bearbeitet.</p>
              </div>
            )}
          </div>
        </section>
        <section className="admin-calendar" aria-label="Buchungskalender">
          <header className="admin-calendar-header">
            <div>
              <span className="micro-label">Monatsübersicht</span>
              <h2>
                {new Date(calendarMonth + "-01T12:00:00").toLocaleDateString(
                  "de-AT",
                  { month: "long", year: "numeric" },
                )}
              </h2>
            </div>
            <div className="admin-calendar-controls">
              <button
                type="button"
                onClick={() => {
                  setSlotsLoading(true);
                  setCalendarMonth(moveMonth(calendarMonth, -1));
                }}
                aria-label="Vorheriger Monat"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => {
                  setSlotsLoading(true);
                  setCalendarMonth(today.slice(0, 7));
                  setSelectedCalendarDate(today);
                }}
              >
                Heute
              </button>
              <button
                type="button"
                onClick={() => {
                  setSlotsLoading(true);
                  setCalendarMonth(moveMonth(calendarMonth, 1));
                }}
                aria-label="Nächster Monat"
              >
                →
              </button>
            </div>
          </header>
          <div className="admin-calendar-weekdays">
            {adminWeekdays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="admin-calendar-grid">
            {adminCalendarDates.map((date) => {
              const dayBookings = bookingsByDate.get(date) ?? [];
              const outside = date.slice(0, 7) !== calendarMonth;
              const enabledCount = adminSlotTimes.filter((time) =>
                enabledSlots.has(`${date}|${time}`),
              ).length;
              return (
                <button
                  type="button"
                  key={date}
                  className={`admin-calendar-day${outside ? " outside" : ""}${date === today ? " today" : ""}${date === selectedCalendarDate ? " selected" : ""}`}
                  onClick={() => {
                    setSelectedCalendarDate(
                      date === selectedCalendarDate ? null : date,
                    );
                    if (outside) {
                      setSlotsLoading(true);
                      setCalendarMonth(date.slice(0, 7));
                    }
                  }}
                  aria-label={`${new Date(date + "T12:00:00").toLocaleDateString("de-AT", { weekday: "long", day: "numeric", month: "long" })}, ${dayBookings.length} Buchungen`}
                >
                  <span className="admin-calendar-date">
                    {Number(date.slice(-2))}
                  </span>
                  <span className="admin-calendar-events">
                    {dayBookings.slice(0, 3).map((booking) => (
                      <span
                        className={`admin-calendar-event ${booking.status}${booking.instructor_id ? "" : " instructor-missing"}`}
                        key={booking.id}
                      >
                        <b>{booking.simulator}</b> · {booking.customer_name} ·{" "}
                        {booking.flight_time}
                        {!booking.instructor_id && (
                          <i title="Instructor fehlt">!</i>
                        )}
                      </span>
                    ))}
                    {dayBookings.length > 3 && (
                      <span className="admin-calendar-more">
                        +{dayBookings.length - 3} weitere
                      </span>
                    )}
                  </span>
                  {enabledCount > 0 && (
                    <span className="admin-slot-count">
                      {enabledCount} frei
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <footer className="admin-calendar-footer">
            <div className="admin-calendar-legend">
              {Object.entries(statusLabels).map(([status, label]) => (
                <span key={status}>
                  <i className={status} />
                  {label}
                </span>
              ))}
            </div>
            <span>
              {
                bookings.filter(
                  (booking) =>
                    booking.flight_date.slice(0, 7) === calendarMonth,
                ).length
              }{" "}
              Buchungen in diesem Monat
            </span>
          </footer>
          {selectedCalendarDate && (
            <section className="calendar-instructor-planning">
              <header>
                <div>
                  <span className="micro-label">
                    Besetzung am {selectedCalendarDate}
                  </span>
                  <h3>Verfügbare Instructoren nach Simulator</h3>
                </div>
              </header>
              <div>
                {simulators.map((simulator) => {
                  const assignment = instructorAssignments.find(
                      (item) =>
                        item.flight_date === selectedCalendarDate &&
                        item.simulator === simulator.name,
                    ),
                    requiredBookings = bookings
                      .filter(
                        (booking) =>
                          booking.flight_date === selectedCalendarDate &&
                          booking.simulator === simulator.name &&
                          booking.status !== "cancelled",
                      ),
                    requiredTimes = requiredBookings.map((booking) => booking.flight_time),
                    activeInstructors = instructors.filter((item) => item.active),
                    isAvailable = (item: Instructor) => {
                      if (!(item.capabilities ?? []).includes(simulator.name)) return false;
                      const range = (item.availabilityRanges ?? []).find(entry => entry.available_date === selectedCalendarDate);
                      if (!range) return false;
                      return requiredBookings.length === 0 || requiredBookings.some(booking => bookingFitsAvailability(booking.flight_time, booking.duration, range.available_from, range.available_until));
                    },
                    available = activeInstructors.filter(isAvailable);
                  return (
                    <article key={simulator.name}>
                      <div>
                        <b>{simulator.name}</b>
                        <small>
                          {assignment
                            ? assignment.instructor_name
                            : requiredTimes.length
                              ? `${requiredTimes.join(", ")} Uhr · ${available.length} verfügbar`
                              : "Keine Buchung an diesem Tag"}
                        </small>
                        {available.length > 0 && !assignment && (
                          <span className="available-instructor-names">
                            {available.map((item) => { const range=(item.availabilityRanges??[]).find(entry=>entry.available_date===selectedCalendarDate); return `${item.name} (${range?.available_from} bis ${range?.available_until})`; }).join(", ")}
                          </span>
                        )}
                      </div>
                      <select
                        aria-label={`Instructor für ${simulator.name}`}
                        value={assignment?.instructor_id ?? ""}
                        onChange={(event) =>
                          void scheduleInstructor(
                            simulator.name,
                            event.target.value,
                          )
                        }
                      >
                        <option value="">
                          {assignment
                            ? "Nicht zugeordnet"
                            : available.length
                              ? "Instructor wählen"
                              : "Niemand verfügbar"}
                        </option>
                        {activeInstructors.map((item) => (
                          <option className={isAvailable(item) ? "instructor-option-available" : ""} disabled={!isAvailable(item)} value={item.id} key={item.id}>
                            {isAvailable(item) ? `✓ ${item.name} · verfügbar` : `${item.name} · nicht verfügbar`}
                          </option>
                        ))}
                      </select>
                      {assignment && (
                        <button
                          type="button"
                          onClick={() =>
                            void notifyInstructor(assignment.instructor_id)
                          }
                        >
                          Tagesplan mailen
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </section>
        <section
          className="slot-manager"
          aria-label="Buchbare Termine freischalten"
        >
          <header>
            <div>
              <span className="micro-label">Verfügbarkeit</span>
              <h2>Termine freischalten</h2>
              <p>
                {selectedDateLabel
                  ? selectedDateLabel
                  : "Wählen Sie zuerst einen Tag im Kalender."}
              </p>
            </div>
            <label>
              Simulator
              <select
                value={slotSimulator}
                onChange={(event) => {
                  setSlotsLoading(true);
                  setSlotSimulator(event.target.value);
                }}
              >
                {simulators.map((simulator) => (
                  <option key={simulator.name}>{simulator.name}</option>
                ))}
              </select>
            </label>
          </header>
          {selectedCalendarDate ? (
            <>
            <div className="slot-day-actions">
              <button type="button" disabled={slotsLoading || slotSaving !== null || selectedCalendarDate < today} onClick={() => void toggleAllSlots(selectedCalendarDate, true)}>Alle Termine freischalten</button>
              <button type="button" disabled={slotsLoading || slotSaving !== null || selectedCalendarDate < today} onClick={() => void toggleAllSlots(selectedCalendarDate, false)}>Alle Termine sperren</button>
            </div>
            <div className="slot-toggle-grid">
              {adminSlotTimes.map((time) => {
                const key = `${selectedCalendarDate}|${time}`;
                const enabled = enabledSlots.has(key);
                return (
                  <button
                    type="button"
                    key={time}
                    className={enabled ? "enabled" : "locked"}
                    disabled={
                      slotsLoading ||
                      slotSaving === key ||
                      selectedCalendarDate < today
                    }
                    onClick={() => void toggleSlot(selectedCalendarDate, time)}
                    aria-pressed={enabled}
                  >
                    <span>{time}</span>
                    <small>
                      {slotSaving === key
                        ? "Speichert ..."
                        : enabled
                          ? "Freigeschaltet"
                          : "Gesperrt"}
                    </small>
                  </button>
                );
              })}
            </div>
            </>
          ) : (
            <div className="slot-manager-empty">
              Alle Termine sind standardmäßig gesperrt. Wählen Sie einen Tag und
              schalten Sie die gewünschten Zeiten je Simulator frei.
            </div>
          )}
        </section>
        <div className="admin-list-heading">
          <div>
            <span className="micro-label">Detailansicht</span>
            <h2>
              {selectedDateLabel
                ? `Buchungen am ${selectedDateLabel}`
                : "Alle Buchungen"}
            </h2>
          </div>
          {selectedCalendarDate && (
            <button type="button" onClick={() => setSelectedCalendarDate(null)}>
              Datumsfilter löschen
            </button>
          )}
        </div>
        <div className="admin-toolbar">
          <label>
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, E-Mail oder Referenz suchen"
            />
          </label>
          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as "all" | BookingStatus)
            }
          >
            <option value="all">Alle Status</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            onClick={() => void checkReminders()}
            disabled={checkingReminders}
          >
            {checkingReminders ? "Prüft ..." : "24h-Erinnerungen"}
          </button>
          <button onClick={() => void loadBookings()}>↻ Aktualisieren</button>
        </div>
        {dataError && (
          <div className="admin-error" role="alert">
            {dataError}
          </div>
        )}
        {notice && (
          <div className="admin-notice" role="status">
            {notice}
          </div>
        )}
        <div className="booking-table-wrap">
          <table className="booking-table">
            <thead>
              <tr>
                <th>Referenz und Kunde</th>
                <th>Flugerlebnis</th>
                <th>Termin</th>
                <th>Anmerkung</th>
                <th>E-Mail</th>
                <th>Status</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {visibleBookings.map((booking) => (
                <tr
                  className={
                    booking.instructor_id ? "" : "booking-instructor-missing"
                  }
                  key={booking.id}
                >
                  <td>
                    <strong>{booking.reference}</strong>
                    <span>{booking.customer_name}</span>
                    <small>
                      {booking.customer_email}
                      <br />
                      {booking.customer_phone}
                    </small>
                  </td>
                  <td>
                    <strong>{booking.simulator}</strong>
                    <span>
                      {booking.duration} Minuten
                      {booking.gift ? " · Geschenkgutschein" : ""}
                    </span>
                    <small
                      className={
                        booking.instructor_id
                          ? "instructor-ok"
                          : "instructor-warning"
                      }
                    >
                      {booking.instructor_name ?? "Instructor fehlt"}
                    </small>
                    {booking.voucher_code && (
                      <small>
                        Code: {booking.voucher_code}
                        <br />
                        Rabatt: €{" "}
                        {(booking.discount_amount_cents / 100).toFixed(2)}
                      </small>
                    )}
                  </td>
                  <td>
                    <strong>
                      {new Date(
                        booking.flight_date + "T12:00:00",
                      ).toLocaleDateString("de-AT", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </strong>
                    <span>{booking.flight_time} Uhr</span>
                    {booking.proposed_date && (
                      <small>
                        Vorschlag: {booking.proposed_date},{" "}
                        {booking.proposed_time}
                      </small>
                    )}
                  </td>
                  <td className="booking-remark-cell">
                    {booking.remark || "Keine Anmerkung"}
                    {booking.internal_notes && (
                      <small className="internal-note-indicator">
                        Interne Notiz vorhanden
                      </small>
                    )}
                  </td>
                  <td>
                    <span
                      className={
                        booking.request_email_sent_at
                          ? "email-state sent"
                          : "email-state pending"
                      }
                    >
                      Anfrage {booking.request_email_sent_at ? "✓" : "!"}
                    </span>
                    <span
                      className={
                        booking.confirmation_email_sent_at
                          ? "email-state sent"
                          : "email-state pending"
                      }
                    >
                      Bestätigung{" "}
                      {booking.confirmation_email_sent_at ? "✓" : "-"}
                    </span>
                    <span
                      className={
                        booking.reminder_email_sent_at
                          ? "email-state sent"
                          : "email-state pending"
                      }
                    >
                      Erinnerung {booking.reminder_email_sent_at ? "✓" : "-"}
                    </span>
                    {booking.email_error && (
                      <small
                        className="email-error"
                        title={booking.email_error}
                      >
                        Zustellung prüfen
                      </small>
                    )}
                  </td>
                  <td>
                    <select
                      className={"status-select " + booking.status}
                      value={booking.status}
                      disabled={savingId === booking.id}
                      onChange={(event) =>
                        void updateStatus(
                          booking.id,
                          event.target.value as BookingStatus,
                        )
                      }
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option value={value} key={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className="booking-more"
                      type="button"
                      onClick={() => setManagedBooking(booking)}
                      aria-label={"Buchung " + booking.reference + " verwalten"}
                    >
                      •••
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleBookings.length === 0 && (
            <div className="empty-bookings">
              <span>✈</span>
              <h3>Keine Buchungen gefunden</h3>
              <p>
                Neue Buchungsanfragen erscheinen automatisch an dieser Stelle.
              </p>
              <a className="button primary" href="/buchen">
                Testbuchung anlegen
              </a>
            </div>
          )}
        </div>
        {managedBooking && (
          <BookingManager
            booking={managedBooking}
            onClose={() => setManagedBooking(null)}
            onUpdated={loadBookings}
          />
        )}
      </section>
    </main>
  );
}
