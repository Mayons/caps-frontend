import { useState } from 'react';
import { Link } from 'react-router-dom';
import { capsApi } from '../api/caps';
import { errorMessage } from '../api/client';
import type { Appointment } from '../api/types';
import { useAsync } from '../utils/useAsync';
import { formatDateTime, fullName } from '../utils/dates';
import { Alert, EmptyState, Loading, PageHeader, Pager, StatusBadge } from '../components/Feedback';

type Scope = 'upcoming' | 'past';

export function MyAppointmentsPage() {
  const [scope, setScope] = useState<Scope>('upcoming');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const appointments = useAsync(() => capsApi.listMyAppointments({ scope, page }), [scope, page]);

  const handleCancel = async (appointment: Appointment) => {
    if (!window.confirm(`¿Cancelar el turno del ${formatDateTime(appointment.startAt)}?`)) return;
    try {
      await capsApi.cancelAppointment(appointment.id);
      setMessage({ kind: 'success', text: 'El turno fue cancelado.' });
      appointments.reload();
    } catch (err) {
      setMessage({ kind: 'error', text: errorMessage(err) });
    }
  };

  const changeScope = (value: Scope) => {
    setScope(value);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Mis turnos"
        actions={<Link className="btn" to="/turnos/nuevo">Sacar un turno</Link>}
      />

      <div className="row" role="tablist" style={{ marginBottom: '1rem' }}>
        <button role="tab" aria-selected={scope === 'upcoming'} className={`btn ${scope === 'upcoming' ? '' : 'btn-secondary'}`} onClick={() => changeScope('upcoming')}>Próximos</button>
        <button role="tab" aria-selected={scope === 'past'} className={`btn ${scope === 'past' ? '' : 'btn-secondary'}`} onClick={() => changeScope('past')}>Anteriores</button>
      </div>

      {message && <Alert kind={message.kind}>{message.text}</Alert>}
      {appointments.loading && <Loading />}
      {appointments.error && <Alert>{appointments.error}</Alert>}
      {appointments.data?.items.length === 0 && (
        <EmptyState title={scope === 'upcoming' ? 'No tenés turnos próximos' : 'No tenés turnos anteriores'} />
      )}

      <ul className="list">
        {appointments.data?.items.map((appointment) => {
          const editable = appointment.status === 'CONFIRMED' && new Date(appointment.startAt) > new Date();
          return (
            <li key={appointment.id} className="card stack">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0 }}>{formatDateTime(appointment.startAt)}</h2>
                <StatusBadge status={appointment.status} />
              </div>
              <p style={{ margin: 0 }}>
                {appointment.specialty.name} con {fullName(appointment.professional)}
              </p>
              <p className="muted small mono" style={{ margin: 0 }}>Turno N.º {appointment.id}</p>
              {editable && (
                <div className="form-actions">
                  <Link className="btn btn-secondary" to={`/turnos/${appointment.id}/editar`}>Cambiar horario</Link>
                  <button className="btn btn-danger" onClick={() => handleCancel(appointment)}>Cancelar</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {appointments.data && <Pager {...appointments.data} onChange={setPage} />}
    </>
  );
}
