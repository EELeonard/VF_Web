"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
type Range = {
  available_date: string;
  available_from: string;
  available_until: string;
};
const monthKey = (date = new Date()) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
function dates(month: string) {
  const [year, value] = month.split("-").map(Number),
    first = new Date(Date.UTC(year, value - 1, 1)),
    offset = (first.getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) =>
    new Date(Date.UTC(year, value - 1, index - offset + 1))
      .toISOString()
      .slice(0, 10),
  );
}
function rangeLabel(range?: Range) {
  if (!range) return "Nicht verfügbar";
  if (range.available_from === "00:00" && range.available_until === "23:59")
    return "Ganzer Tag";
  if (range.available_from === "00:00") return `Bis ${range.available_until}`;
  if (range.available_until === "23:59") return `Ab ${range.available_from}`;
  return `${range.available_from} bis ${range.available_until}`;
}

export default function InstructorAvailability() {
  const router = useRouter(),
    [month, setMonth] = useState(monthKey()),
    [selected, setSelected] = useState(""),
    [ranges, setRanges] = useState<Map<string, Range>>(new Map()),
    [from, setFrom] = useState("09:00"),
    [until, setUntil] = useState("18:00"),
    [draftMode, setDraftMode] = useState<"full_day" | "custom" | "unavailable">("unavailable"),
    [name, setName] = useState(""),
    [capabilities, setCapabilities] = useState<string[]>([]),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    calendar = useMemo(() => dates(month), [month]);
  const load = useCallback(async () => {
    const response = await fetch(
        `/api/admin/instructor-availability?month=${month}`,
      ),
      data = await response.json();
    if (response.status === 401) {
      router.replace("/admin");
      return;
    }
    if (response.ok) {
      setName(data.instructor.name);
      setCapabilities(data.capabilities);
      setRanges(
        new Map(
          (data.ranges as Range[]).map((item) => [item.available_date, item]),
        ),
      );
    } else setError(data.error);
  }, [month, router]);
  useEffect(() => {
    void load();
  }, [load]);
  async function setDay(
    date: string,
    mode: "full_day" | "custom" | "unavailable",
    start = from,
    end = until,
  ) {
    setSelected(date);
    setDraftMode(mode);
    setSaving(true);
    setError("");
    const response = await fetch("/api/admin/instructor-availability", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date, mode, from: start, until: end }),
      }),
      data = await response.json();
    if (response.ok) {
      setRanges((current) => {
        const next = new Map(current);
        if (data.range) next.set(date, data.range);
        else next.delete(date);
        return next;
      });
      if (data.range) {
        setFrom(data.range.available_from);
        setUntil(data.range.available_until);
      }
    } else setError(data.error);
    setSaving(false);
  }
  function selectDate(date: string) {
    const range = ranges.get(date);
    if (range) {
      setFrom(range.available_from);
      setUntil(range.available_until);
      setDraftMode(rangeLabel(range) === "Ganzer Tag" ? "full_day" : "custom");
      setSelected(date);
    } else void setDay(date, "full_day", "00:00", "23:59");
  }
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin");
  }
  const wholeDaySelected = draftMode === "full_day";
  const customRangeSelected = draftMode === "custom";
  return (
    <main className="instructor-portal">
      <header>
        <div>
          <span className="brand-mark">VF</span>
          <div>
            <b>Vienna Flight</b>
            <small>Instructor Portal</small>
          </div>
        </div>
        <button onClick={() => void logout()}>Abmelden</button>
      </header>
      <section className="instructor-portal-content">
        <span className="micro-label">Willkommen, {name}</span>
        <h1>Meine Verfügbarkeit</h1>
        <p>
          Ihre Freigaben:{" "}
          {capabilities.length
            ? capabilities.join(", ")
            : "Noch keine Simulator-Berechtigungen"}
        </p>
        {error && <div className="admin-error">{error}</div>}
        <div className="availability-calendar">
          <header>
            <button
              onClick={() => {
                const date = new Date(month + "-01");
                date.setUTCMonth(date.getUTCMonth() - 1);
                setMonth(monthKey(date));
              }}
            >
              ←
            </button>
            <h2>
              {new Date(month + "-01T12:00:00Z").toLocaleDateString("de-AT", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              })}
            </h2>
            <button
              onClick={() => {
                const date = new Date(month + "-01");
                date.setUTCMonth(date.getUTCMonth() + 1);
                setMonth(monthKey(date));
              }}
            >
              →
            </button>
          </header>
          <div className="availability-weekdays">
            {["MO", "DI", "MI", "DO", "FR", "SA", "SO"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="availability-days">
            {calendar.map((date) => {
              const range = ranges.get(date);
              return (
                <button
                  className={`${date.slice(0, 7) !== month ? "outside " : ""}${selected === date ? "selected " : ""}${range ? "available-day" : ""}`}
                  disabled={
                    date < new Date().toISOString().slice(0, 10) || saving
                  }
                  onClick={() => selectDate(date)}
                  key={date}
                >
                  <b>{Number(date.slice(-2))}</b>
                  <small>{rangeLabel(range)}</small>
                </button>
              );
            })}
          </div>
        </div>
        {selected && (
          <section className="availability-times availability-range">
            <h2>
              {new Date(selected + "T12:00:00Z").toLocaleDateString("de-AT", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                timeZone: "UTC",
              })}
            </h2>
            <p>
              Legen Sie ein beliebiges Zeitfenster fest oder geben Sie den
              ganzen Tag frei.
            </p>
            <div className="availability-range-actions">
              <button
                className={
                  wholeDaySelected ? "available" : ""
                }
                disabled={saving}
                onClick={() =>
                  void setDay(selected, "full_day", "00:00", "23:59")
                }
              >
                <b>Ganzer Tag</b>
                <span>Alle Termine</span>
              </button>
              <label>
                Verfügbar ab
                <input
                  type="time"
                  value={from}
                  onChange={(event) => {
                    setFrom(event.target.value);
                    setDraftMode("custom");
                  }}
                />
              </label>
              <label>
                Verfügbar bis
                <input
                  type="time"
                  value={until}
                  onChange={(event) => {
                    setUntil(event.target.value);
                    setDraftMode("custom");
                  }}
                />
              </label>
              <button
                className={customRangeSelected ? "available" : ""}
                disabled={saving || from >= until}
                onClick={() => void setDay(selected, "custom")}
              >
                <b>Zeitfenster speichern</b>
                <span>
                  {from} bis {until}
                </span>
              </button>
              <button
                className={draftMode === "unavailable" ? "available" : ""}
                disabled={saving}
                onClick={() => void setDay(selected, "unavailable")}
              >
                <b>Nicht verfügbar</b>
                <span>Freigabe entfernen</span>
              </button>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
