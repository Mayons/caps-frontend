import { useState } from 'react';
import { capsApi } from '../api/caps';
import { useAsync } from '../utils/useAsync';
import { formatDate, formatTime, fullName, todayIso } from '../utils/dates';
import { TextField } from '../components/Field';
import { Alert, EmptyState, Loading, PageHeader, StatusBadge } from '../components/Feedback';

/** Agenda del profesional: solo sus propios turnos (el backend lo garantiza). */
export function AgendaPage() {
  const [date, setDate] = useState(todayIso());
  const agenda = useAsync(() => capsApi.getAgenda(date), [date]);

  return (
    <>
      <PageHeader
        title="Mi agenda"
        subtitle={agenda.data ? fullName(agenda.data.professional) : undefined}
        actions={<TextField label="Día" name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
      />

      {agenda.loading && <Loading />}
      {agenda.error && <Alert>{agenda.error}</Alert>}
      {agenda.data && (
        <div className="stack">
          <div className="stats">
            <div className="stat"><strong>{agenda.data.confirmedForDate}</strong> turnos confirmados el {formatDate(`${date}T12:00:00-03:00`)}</div>
            <div className="stat"><strong>{agenda.data.upcomingConfirmed}</strong> turnos próximos en total</div>
          </div>

          {agenda.data.appointments.length === 0 ? (
            <EmptyState title="No tenés turnos para este día" />
          ) : (
            <table className="responsive-table">
              <thead>
                <tr><th>Hora</th><th>Paciente</th><th>Teléfono</th><th>Especialidad</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {agenda.data.appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td data-label="Hora">{formatTime(appointment.startAt)} – {formatTime(appointment.endAt)}</td>
                    <td data-label="Paciente">{appointment.patient ? fullName(appointment.patient) : '—'}</td>
                    <td data-label="Teléfono">{appointment.patient?.phone ?? '—'}</td>
                    <td data-label="Especialidad">{appointment.specialty.name}</td>
                    <td data-label="Estado"><StatusBadge status={appointment.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
}
