// Todas las fechas se muestran en hora de Argentina, sin importar dónde
// esté configurada la computadora o el celular de quien usa la app.
export const TIME_ZONE = 'America/Argentina/Buenos_Aires';
// Argentina usa UTC-03:00 todo el año (sin horario de verano).
const ARGENTINA_OFFSET = '-03:00';

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso));
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat('es-AR', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  );
}

export function formatDateTime(iso: string) {
  return `${formatDate(iso)}, ${formatTime(iso)} h`;
}

/** Hoy en formato YYYY-MM-DD (calendario de Argentina). */
export function todayIso() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date());
}

/** Convierte una fecha ISO a YYYY-MM-DD de Argentina (para inputs de fecha). */
export function toDateInput(iso: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date(iso));
}

/** Convierte una fecha ISO a HH:MM de Argentina (para inputs de hora). */
export function toTimeInput(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  );
}

/** Une un día (YYYY-MM-DD) y una hora (HH:MM) de Argentina en una fecha ISO. */
export function argentinaDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00${ARGENTINA_OFFSET}`).toISOString();
}

export function fullName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`;
}
