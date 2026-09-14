const viennaFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Vienna",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function timezoneOffsetAt(instant: Date) {
  const parts = Object.fromEntries(viennaFormatter.formatToParts(instant).map((part) => [part.type, part.value]));
  const representedAsUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  return representedAsUtc - instant.getTime();
}

export function viennaLocalToUtc(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  let instant = new Date(localAsUtc - timezoneOffsetAt(new Date(localAsUtc)));
  instant = new Date(localAsUtc - timezoneOffsetAt(instant));
  const rendered = viennaFormatter.formatToParts(instant);
  const parts = Object.fromEntries(rendered.map((part) => [part.type, part.value]));
  const roundTrip = `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
  if (roundTrip !== `${date} ${time}`) throw new Error("Der gewählte Termin ist wegen der Zeitumstellung ungültig.");
  return instant.toISOString();
}

export function bookingBufferMinutes(duration: number) {
  return duration === 30 ? 15 : 30;
}

export function bookingOperationalWindow(flightStartAt: string, duration: number) {
  const start = new Date(flightStartAt).getTime();
  const buffer = bookingBufferMinutes(duration) * 60_000;
  return {
    startsAt: new Date(start - buffer).toISOString(),
    endsAt: new Date(start + duration * 60_000 + buffer).toISOString(),
  };
}

export function bookingFitsAvailability(flightTime: string, duration: number, availableFrom: string, availableUntil: string) {
  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };
  const buffer = bookingBufferMinutes(duration);
  return toMinutes(flightTime) - buffer >= toMinutes(availableFrom)
    && toMinutes(flightTime) + duration + buffer <= toMinutes(availableUntil) + 1;
}
