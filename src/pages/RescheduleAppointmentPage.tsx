import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { capsApi } from '../api/caps';
import { errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useAsync } from '../utils/useAsync';
import { formatDateTime, fullName, toDateInput, todayIso } from '../utils/dates';
import { TextField } from '../components/Field';
import { Alert, Loading, PageHeader } from '../components/Feedback';
import { SlotPicker, type SelectedSlot } from '../components/SlotPicker';

/** Reprogramar un turno (lo usa el paciente dueño y también el personal de turnos). */
export function RescheduleAppointmentPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const appointment = useAsync(() => capsApi.getAppointment(id), [id]);
  const [date, setDate] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (appointment.loading) return <Loading />;
  if (appointment.error || !appointment.data) return <Alert>{appointment.error ?? 'Turno no encontrado'}</Alert>;

  const current = appointment.data;
  const selectedDate = date ?? toDateInput(current.startAt);
  const backTo = profile?.role === 'PATIENT' ? '/mis-turnos' : '/gestion/turnos';

  const handleSave = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await capsApi.rescheduleAppointment(id, { startAt: selected.slot.startAt });
      navigate(backTo, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setSelected(null);
      setRefreshKey((key) => key + 1);
    } finally {
      setSubmitting(false);
    }
  };

  if (current.status !== 'CONFIRMED') {
    return <Alert kind="warning">Este turno está cancelado y no se puede modificar.</Alert>;
  }

  return (
    <>
      <PageHeader
        title="Cambiar horario del turno"
        subtitle={`${current.specialty.name} con ${fullName(current.professional)} — actual: ${formatDateTime(current.startAt)}`}
      />
      <div className="split sidebar-left">
        <section className="card form">
          <TextField label="Nuevo día" name="date" type="date" min={todayIso()} value={selectedDate} onChange={(e) => { setDate(e.target.value); setSelected(null); }} />
          {selected && (
            <>
              <Alert kind="info">Nuevo horario: {formatDateTime(selected.slot.startAt)}</Alert>
              <button className="btn btn-block" onClick={handleSave} disabled={submitting}>
                {submitting ? 'Guardando…' : 'Confirmar cambio'}
              </button>
            </>
          )}
          <button className="btn btn-secondary btn-block" onClick={() => navigate(backTo)}>Volver</button>
        </section>
        <section className="stack">
          {error && <Alert>{error}</Alert>}
          <SlotPicker
            key={refreshKey}
            date={selectedDate}
            professionalId={current.professional.id}
            specialtyId={current.specialty.id}
            selected={selected}
            onSelect={setSelected}
          />
        </section>
      </div>
    </>
  );
}
