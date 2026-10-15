import { useState } from 'react';
import { Link } from 'react-router-dom';
import { capsApi } from '../../api/caps';
import { errorMessage } from '../../api/client';
import type { Appointment, AppointmentStatus } from '../../api/types';
import { useAsync } from '../../utils/useAsync';
import { formatDateTime, fullName, todayIso } from '../../utils/dates';
import { SelectField, TextField } from '../../components/Field';
import { Alert, EmptyState, Loading, PageHeader, Pager, StatusBadge } from '../../components/Feedback';

/** Listado de turnos para gestores y administradores. */
export function AppointmentsAdminPage() {
  const [date, setDate] = useState(todayIso());
  const [professionalId, setProfessionalId] = useState('');
  const [status, setStatus] = useState<AppointmentStatus | ''>('');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const professionals = useAsync(() => capsApi.listProfessionals(), []);
  const appointments = useAsync(
    () => capsApi.listAllAppointments({ date: date || undefined, professionalId: professionalId || undefined, status: status || undefined, page }),
    [date, professionalId, status, page],
  );

  const handleCancel = async (appointment: Appointment) => {
    if (!window.confirm(`¿Cancelar el turno de ${appointment.patient ? fullName(appointment.patient) : 'este paciente'}?`)) return;
    try {
      await capsApi.cancelAppointment(appointment.id);
      setMessage({ kind: 'success', text: 'Turno cancelado.' });
      appointments.reload();
    } catch (err) {
      setMessage({ kind: 'error', text: errorMessage(err) });
    }
  };

  const filter = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  return (
    <>
      <PageHeader title="Turnos" subtitle={appointments.data ? `${appointments.data.total} turnos encontrados` : undefined} />

      <div className="card form-grid two" style={{ marginBottom: '1.5rem' }}>
        <TextField label="Día" name="date" type="date" value={date} onChange={(e) => filter(setDate)(e.target.value)} />
        <SelectField label="Profesional" name="professional" value={professionalId} onChange={(e) => filter(setProfessionalId)(e.target.value)}>
          <option value="">Todos</option>
          {professionals.data?.map((p) => <option key={p.id} value={p.id}>{fullName(p)}</option>)}
        </SelectField>
        <SelectField label="Estado" name="status" value={status} onChange={(e) => filter(setStatus)(e.target.value as AppointmentStatus | '')}>
          <option value="">Todos</option>
          <option value="CONFIRMED">Confirmados</option>
          <option value="CANCELLED">Cancelados</option>
        </SelectField>
      </div>

      {message && <Alert kind={message.kind}>{message.text}</Alert>}
      {appointments.loading && <Loading />}
      {appointments.error && <Alert>{appointments.error}</Alert>}
      {appointments.data?.items.length === 0 && <EmptyState title="No hay turnos con esos filtros" />}
      {appointments.data && appointments.data.items.length > 0 && (
        <table className="responsive-table">
          <thead>
            <tr><th>Día y hora</th><th>Paciente</th><th>Contacto</th><th>Profesional</th><th>Especialidad</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {appointments.data.items.map((appointment) => {
              const editable = appointment.status === 'CONFIRMED' && new Date(appointment.startAt) > new Date();
              return (
                <tr key={appointment.id}>
                  <td data-label="Día y hora">{formatDateTime(appointment.startAt)}</td>
                  <td data-label="Paciente">{appointment.patient ? fullName(appointment.patient) : '—'}</td>
                  <td data-label="Contacto">{appointment.patient?.phone ?? appointment.patient?.email ?? '—'}</td>
                  <td data-label="Profesional">{fullName(appointment.professional)}</td>
                  <td data-label="Especialidad">{appointment.specialty.name}</td>
                  <td data-label="Estado"><StatusBadge status={appointment.status} /></td>
                  <td className="actions">
                    {editable && (
                      <>
                        <Link className="btn btn-secondary" to={`/turnos/${appointment.id}/editar`}>Reprogramar</Link>
                        <button className="btn btn-danger" onClick={() => handleCancel(appointment)}>Cancelar</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {appointments.data && <Pager {...appointments.data} onChange={setPage} />}
    </>
  );
}
