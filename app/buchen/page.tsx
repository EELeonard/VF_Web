"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { simulators, simulatorsEnglish } from "../lib/site-data";
import { BOOKING_TIMES } from "../lib/availability-db";
import { formatDateNumeric } from "../lib/date-format";

const weekdayLabels = ["MO", "DI", "MI", "DO", "FR", "SA", "SO"];
const weekdayLabelsEnglish = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const timeSlots = [...BOOKING_TIMES];

function localISO(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function startOfToday() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export default function BookingPage() {
  const pathname = usePathname();
  const english = pathname.startsWith("/en");
  const text = english ? {
    eyebrow:"Online booking", title:"Choose your", titleAccent:"flight appointment.", intro:"Released appointments for the next six months. Complete your request in a few simple steps.",
    received:"Booking request received", success:"Your flight is reserved.", reference:"Reference", another:"Make another request", home:"Home",
    step1:"Simulator and duration", step1Help:"Choose your cockpit and preferred flight time.", minutes:"minutes",
    step2:"Choose a date", previous:"Previous month", next:"Next month",
    available:"Released", few:"Few times", locked:"Fully booked", step3:"Start time", step4:"Your details", step4Help:"For confirmation and any questions about your booking.",
    name:"Name", namePlaceholder:"First and last name", email:"Email", phone:"Telephone", gift:"Order as a gift voucher", remark:"Booking note", optional:"optional", remarkPlaceholder:"For example your preferred route, occasion, experience or accessibility requirements", voucherCode:"Voucher code", voucherPlaceholder:"Enter code", applyVoucher:"Apply code", voucherApplied:"Voucher applied", voucherEmail:"Enter your email address before checking the code.", discount:"Discount",
    consent:"I agree to the processing of my data for this booking request.", selection:"Your selection", date:"Date", start:"Start time", duration:"Duration", voucher:"Voucher", yes:"Yes", no:"No", total:"Total price",
    savedEmail:"Your request receipt has been sent by email.", savedNoEmail:"Your request has been saved.", pending:"A binding confirmation follows after review.", bookingNote:"No payment is required yet. The appointment is confirmed after personal review.",
  } : {
    eyebrow:"Online Buchung", title:"Wählen Sie Ihren", titleAccent:"Flugtermin.", intro:"Freigeschaltete Termine für die kommenden sechs Monate. Anfrage in wenigen Schritten abschließen.",
    received:"Buchungsanfrage eingegangen", success:"Ihr Flug ist vorgemerkt.", reference:"Referenz", another:"Weitere Anfrage", home:"Zur Startseite",
    step1:"Simulator und Flugdauer", step1Help:"Wählen Sie Ihr Cockpit und die gewünschte Flugzeit.", minutes:"Minuten",
    step2:"Datum wählen", previous:"Vorheriger Monat", next:"Nächster Monat",
    available:"Freigeschaltet", few:"Wenige Zeiten", locked:"Ausgebucht", step3:"Startzeit", step4:"Ihre Daten", step4Help:"Für die Buchungsbestätigung und eventuelle Rückfragen.",
    name:"Name", namePlaceholder:"Vor- und Nachname", email:"E-Mail", phone:"Telefon", gift:"Als Gutschein bestellen", remark:"Anmerkung zur Buchung", optional:"optional", remarkPlaceholder:"Zum Beispiel Wunschroute, Anlass, Vorkenntnisse oder besondere Anforderungen", voucherCode:"Gutscheincode", voucherPlaceholder:"Code eingeben", applyVoucher:"Code anwenden", voucherApplied:"Gutschein angewendet", voucherEmail:"Bitte geben Sie zuerst Ihre E-Mail-Adresse ein.", discount:"Rabatt",
    consent:"Ich stimme der Verarbeitung meiner Daten zur Bearbeitung der Buchungsanfrage zu.", selection:"Ihre Auswahl", date:"Datum", start:"Startzeit", duration:"Flugdauer", voucher:"Gutschein", yes:"Ja", no:"Nein", total:"Gesamtpreis",
    savedEmail:"Die Eingangsbestätigung wurde per E-Mail versendet.", savedNoEmail:"Die Anfrage ist gespeichert.", pending:"Eine verbindliche Bestätigung folgt nach der Freigabe.", bookingNote:"Noch keine Zahlung erforderlich. Der Termin wird nach persönlicher Prüfung bestätigt.",
  };
  const initial = useMemo(() => startOfToday(), []);
  const [displayMonth, setDisplayMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState("");
  const [simulatorIndex, setSimulatorIndex] = useState(0);
  const [duration, setDuration] = useState(60);
  const [time, setTime] = useState("14:00");
  const [gift, setGift] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [availableSlots, setAvailableSlots] = useState<Record<string, string[]>>({});
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [customerEmail, setCustomerEmail] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherChecking, setVoucherChecking] = useState(false);
  const [voucherResult, setVoucherResult] = useState<{ code: string; description: string; discountAmountCents: number; finalPriceCents: number } | null>(null);
  const [voucherError, setVoucherError] = useState("");

  const simulator = simulators[simulatorIndex];
  const displaySimulator = english ? simulatorsEnglish[simulatorIndex] : simulator;
  const durations = Object.keys(simulator.prices).map(Number);
  const price = simulator.prices[duration] ?? simulator.prices[durations[0]];
  const maxMonth = useMemo(() => {
    const date = new Date(initial.getFullYear(), initial.getMonth() + 5, 1);
    return date.getFullYear() * 12 + date.getMonth();
  }, [initial]);
  const currentMonthNumber = initial.getFullYear() * 12 + initial.getMonth();
  const displayMonthNumber = displayMonth.getFullYear() * 12 + displayMonth.getMonth();

  useEffect(() => {
    const controller = new AbortController();
    const month = `${displayMonth.getFullYear()}-${String(displayMonth.getMonth() + 1).padStart(2, "0")}`;
    fetch(`/api/availability?simulator=${encodeURIComponent(simulator.name)}&month=${month}&duration=${duration}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Availability could not be loaded.");
        const grouped: Record<string, string[]> = {};
        for (const slot of data.slots as Array<{ date: string; time: string }>) grouped[slot.date] = [...(grouped[slot.date] ?? []), slot.time];
        setAvailableSlots(grouped);
        const dates = Object.keys(grouped).sort();
        const firstDate = dates[0] ?? "";
        setSelectedDate(firstDate);
        setTime(firstDate ? grouped[firstDate][0] : "");
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setAvailableSlots({});
        setSelectedDate("");
        setBookingError(english ? "Availability could not be loaded." : "Verfügbarkeiten konnten nicht geladen werden.");
      })
      .finally(() => setAvailabilityLoading(false));
    return () => controller.abort();
  }, [displayMonth, duration, simulator.name, english]);

  const calendarDays = useMemo(() => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<Date | null> = Array(firstWeekday).fill(null);
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [displayMonth]);

  const formattedDate = selectedDate ? formatDateNumeric(selectedDate) : (english ? "No date selected" : "Kein Termin ausgewählt");

  function changeMonth(offset: number) {
    setAvailabilityLoading(true);
    setDisplayMonth((month) => new Date(month.getFullYear(), month.getMonth() + offset, 1));
  }

  function chooseSimulator(index: number) {
    setAvailabilityLoading(true);
    setSimulatorIndex(index);
    const nextDurations = Object.keys(simulators[index].prices).map(Number);
    if (!nextDurations.includes(duration)) setDuration(nextDurations[0]);
    setVoucherResult(null); setVoucherError("");
  }

  async function applyVoucher() {
    setVoucherError(""); setVoucherResult(null);
    if (!customerEmail.includes("@")) { setVoucherError(text.voucherEmail); return; }
    if (!voucherCode.trim()) return;
    setVoucherChecking(true);
    try {
      const response = await fetch("/api/vouchers/validate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: voucherCode, email: customerEmail, simulator: simulator.name, duration, language: english ? "en" : "de" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setVoucherCode(data.code); setVoucherResult(data);
    } catch (error) { setVoucherError(error instanceof Error ? error.message : (english ? "The voucher could not be checked." : "Der Gutscheincode konnte nicht geprüft werden.")); }
    finally { setVoucherChecking(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gift && (!selectedDate || !time)) {
      setBookingError(english ? "Please select an available appointment." : "Bitte wählen Sie einen freigegebenen Termin.");
      return;
    }
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setBookingError("");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          simulator: simulator.name,
          duration,
          date: gift ? "" : selectedDate,
          time: gift ? "" : time,
          gift,
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          remark: form.get("remark"),
          voucherCode,
          language: english ? "en" : "de",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? (english ? "The booking could not be saved." : "Die Buchung konnte nicht gespeichert werden."));
      setReference(data.reference);
      setEmailSent(data.emailSent === true);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : (english ? "The booking could not be saved." : "Die Buchung konnte nicht gespeichert werden."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="top">
      <SiteHeader dark />
      <section className="page-hero booking-page-hero">
        <div className="eyebrow"><span /> {text.eyebrow}</div>
        <h1>{text.title}<br /><em>{text.titleAccent}</em></h1>
        <p>{text.intro}</p>
      </section>

      {submitted ? (
        <section className="standalone-success">
          <div className="success-card">
            <div className="success-icon">✓</div><span className="micro-label">{text.received}</span>
            <h3>{text.success}</h3>
            <p>{gift ? (english ? `Your ${simulator.name} gift voucher for ${duration} minutes has been requested.` : `Ihr ${simulator.name} Geschenkgutschein für ${duration} Minuten wurde angefragt.`) : <>{english ? "Your" : "Ihr"} {simulator.name} {english ? "flight on" : "Flug am"} <b>{formattedDate}</b> {english ? "at" : "um"} <b>{time}{english ? "" : " Uhr"}</b> {english ? "has been reserved." : "ist vorgemerkt."}</>} {emailSent ? ` ${text.savedEmail}` : ` ${text.savedNoEmail}`} {text.pending}</p>
            <div className="reference"><span>{text.reference}</span><strong>{reference}</strong></div>
            <div className="success-actions"><button className="button primary form-button" onClick={() => setSubmitted(false)}>{text.another}</button><Link className="button outline-button" href={english ? "/en" : "/"}>{text.home}</Link></div>
          </div>
        </section>
      ) : (
        <form className="booking-workspace" onSubmit={submit}>
          <div className="booking-main">
            <section className="booking-step">
              <div className="step-title"><span>01</span><div><h2>{text.step1}</h2><p>{text.step1Help}</p></div></div>
              <div className="wide-simulator-choices">
                {(english ? simulatorsEnglish : simulators).map((item, index) => <button type="button" className={simulatorIndex === index ? "wide-choice selected" : "wide-choice"} onClick={() => chooseSimulator(index)} key={item.slug}><img src={item.image} alt="" /><span><b>{item.name}</b><small>{item.type}</small></span><i>✓</i></button>)}
              </div>
              <div className="duration-choices full-duration">
                {durations.map((minutes) => <button type="button" className={duration === minutes ? "duration selected" : "duration"} onClick={() => { setAvailabilityLoading(true); setDuration(minutes); setVoucherResult(null); setVoucherError(""); }} key={minutes}><b>{minutes}</b><span>{text.minutes}</span><small>€ {simulator.prices[minutes]}</small></button>)}
              </div>
              <label className="gift-toggle"><input type="checkbox" checked={gift} onChange={(event) => { setGift(event.target.checked); setBookingError(""); }} /><span /><b>{text.gift}</b></label>
            </section>

            {!gift && <section className="booking-step">
              <div className="step-title"><span>02</span><div><h2>{text.step2}</h2></div></div>
              <div className="calendar">
                <div className="calendar-toolbar">
                  <button type="button" onClick={() => changeMonth(-1)} disabled={displayMonthNumber <= currentMonthNumber} aria-label={text.previous}>←</button>
                  <h3>{displayMonth.toLocaleDateString(english ? "en-GB" : "de-AT", { month: "long", year: "numeric" })}</h3>
                  <button type="button" onClick={() => changeMonth(1)} disabled={displayMonthNumber >= maxMonth} aria-label={text.next}>→</button>
                </div>
                <div className="calendar-weekdays">{(english ? weekdayLabelsEnglish : weekdayLabels).map((day) => <span key={day}>{day}</span>)}</div>
                <div className="calendar-grid">
                  {calendarDays.map((day, index) => {
                    if (!day) return <span className="calendar-empty" key={"empty-" + index} />;
                    const value = localISO(day);
                    const slots = availableSlots[value] ?? [];
                    const status = day < startOfToday() || slots.length === 0 ? "closed" : slots.length <= 2 ? "few" : "available";
                    const disabled = status === "closed" || availabilityLoading;
                    return <button type="button" key={value} disabled={disabled} className={"calendar-day " + status + (selectedDate === value ? " selected" : "")} onClick={() => { setSelectedDate(value); setTime(slots[0] ?? ""); }} aria-label={`${day.toLocaleDateString(english ? "en-GB" : "de-AT", { weekday: "long", day: "numeric", month: "long" })}, ${slots.length} ${english ? "available times" : "freie Zeiten"}`}><span>{day.getDate()}</span>{status === "few" && <small>{english ? "few" : "wenige"}</small>}{status === "closed" && day >= startOfToday() && <small>{english ? "fully booked" : "ausgebucht"}</small>}</button>;
                  })}
                </div>
                <div className="calendar-legend"><span><i className="available" /> {text.available}</span><span><i className="few" /> {text.few}</span><span><i className="full" /> {text.locked}</span></div>
              </div>
            </section>}

            {!gift && <section className="booking-step">
              <div className="step-title"><span>03</span><div><h2>{text.step3}</h2><p>{formattedDate}</p></div></div>
              <div className="large-time-grid">{timeSlots.map((slot) => <button type="button" key={slot} disabled={!selectedDate || !(availableSlots[selectedDate] ?? []).includes(slot)} className={time === slot ? "time selected" : "time"} onClick={() => setTime(slot)}><b>{slot}</b><span>{english ? "" : "Uhr"}</span></button>)}</div>
              {!availabilityLoading && !selectedDate && <p className="no-availability">{english ? "There are currently no released appointments for this month. Choose another month or contact us." : "Für diesen Monat sind aktuell keine Termine freigeschaltet. Bitte wählen Sie einen anderen Monat oder kontaktieren Sie uns."}</p>}
            </section>}

            <section className="booking-step">
              <div className="step-title"><span>{gift ? "02" : "04"}</span><div><h2>{text.step4}</h2><p>{text.step4Help}</p></div></div>
              <div className="form-grid booking-contact"><label>{text.name}<input name="name" type="text" required autoComplete="name" maxLength={160} placeholder={text.namePlaceholder} /></label><label>{text.email}<input name="email" type="email" required autoComplete="email" maxLength={254} placeholder="name@example.com" value={customerEmail} onChange={(event) => { setCustomerEmail(event.target.value); setVoucherResult(null); setVoucherError(""); }} /></label><label>{text.phone}<input name="phone" type="tel" required autoComplete="tel" maxLength={80} placeholder="+43 ..." /></label><label className="booking-remark">{text.remark} <span>{text.optional}</span><textarea name="remark" maxLength={2000} rows={5} placeholder={text.remarkPlaceholder} /></label></div>
              <div className="voucher-entry"><label>{text.voucherCode} <span>{text.optional}</span><div><input type="text" maxLength={40} value={voucherCode} onChange={(event) => { setVoucherCode(event.target.value.toUpperCase()); setVoucherResult(null); setVoucherError(""); }} placeholder={text.voucherPlaceholder} autoComplete="off" /><button type="button" disabled={voucherChecking || !voucherCode.trim()} onClick={() => void applyVoucher()}>{voucherChecking ? (english ? "Checking ..." : "Prüft ...") : text.applyVoucher}</button></div></label>{voucherResult && <div className="voucher-success" role="status"><b>✓ {text.voucherApplied}: {voucherResult.code}</b>{voucherResult.description && <span>{voucherResult.description}</span>}</div>}{voucherError && <div className="voucher-error" role="alert">{voucherError}</div>}</div>
              <label className="terms"><input type="checkbox" required /> <span>{text.consent}</span></label>
            </section>
          </div>

          <aside className="booking-sidebar">
            <span className="micro-label">{text.selection}</span>
            <img src={simulator.image} alt={simulator.name + (english ? " flight simulator" : " Flugsimulator")} />
            <h2>{displaySimulator.name}</h2><p>{displaySimulator.type}</p>
            <dl>{!gift && <><div><dt>{text.date}</dt><dd>{formattedDate}</dd></div><div><dt>{text.start}</dt><dd>{time}{english ? "" : " Uhr"}</dd></div></>}<div><dt>{text.duration}</dt><dd>{duration} {text.minutes}</dd></div><div><dt>{text.voucher}</dt><dd>{gift ? text.yes : text.no}</dd></div></dl>
            {voucherResult && <div className="summary-discount"><span>{text.discount} ({voucherResult.code})</span><strong>- € {(voucherResult.discountAmountCents / 100).toFixed(2)}</strong></div>}
            <div className="summary-total"><span>{text.total}</span><strong>{voucherResult && <del>€ {price}</del>} € {voucherResult ? (voucherResult.finalPriceCents / 100).toFixed(2) : price}</strong></div>
            {bookingError && <div className="booking-api-error" role="alert">{bookingError}</div>}
            <button className="button primary form-button" type="submit" disabled={submitting || (!gift && (availabilityLoading || !selectedDate || !time))}>{submitting ? (english ? "Saving ..." : "Wird gespeichert ...") : !gift && availabilityLoading ? (english ? "Loading availability ..." : "Verfügbarkeit wird geladen ...") : gift ? (english ? "Request gift voucher" : "Gutschein anfragen") : (english ? "Request booking" : "Buchung anfragen")} <span>→</span></button>
            <p className="booking-note">{text.bookingNote}</p>
          </aside>
        </form>
      )}
      <SiteFooter language={english ? "en" : "de"} />
    </main>
  );
}
