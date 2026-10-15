import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { capsApi } from '../api/caps';
import { errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useAsync } from '../utils/useAsync';
import { formatDateTime, fullName, todayIso } from '../utils/dates';
import { SelectField, TextField } from '../components/Field';
import { Alert, PageHeader } from '../components/Feedback';
import { SlotPicker, type SelectedSlot } from '../components/SlotPicker';

export function BookingPage() {
  const { status, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const specialtyId = params.get('especialidad') ?? '';
  const professionalId = params.get('profesional') ?? '';
  const date = params.get('fecha') ?? todayIso();

  const [selected, setSelected] = useState<SelectedSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const specialties = useAsync(() => capsApi.listSpecialties(), []);
  const professionals = useAsync(() => capsApi.listProfessionals(specialtyId || undefined), [specialtyId]);

  const updateParams = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
    setSelected(null);
    setError(null);
  };

  const handleConfirm = async () => {
    if (!selected || !specialtyId) return;
    setSubmitting(true);
    setError(null);
    try {
      const appointment = await capsApi.bookAppointment({
        professionalId: selected.professional.id,
        specialtyId,
        startAt: selected.slot.startAt,
      });
      navigate(`/turnos/${appointment.id}/confirmacion`);
    } catch (err) {
      setError(errorMessage(err));
      setSelected(null);
      setRefreshKey((key) => key + 1); // volver a pedir los horarios actualizados
    } finally {
      setSubmitting(false);
    }
  };

  const specialtyName = specialties.data?.find((s) => s.id === specialtyId)?.name;
  const loginRedirect = encodeURIComponent(location.pathname + location.search);

  return (
    <>
      <PageHeader title="Sacar un turno" subtitle="Elegí la especialidad, el día y el horario." />

      <div className="split sidebar-left">
        <section className="card form" aria-label="Filtros">
          {specialties.error && <Alert>{specialties.error}</Alert>}
          <SelectField
            label="Especialidad"
            name="specialty"
            value={specialtyId}
            onChange={(e) => updateParams({ especialidad: e.target.value, profesional: '' })}
          >
            <option value="">Elegí una especialidad</option>
            {specialties.data?.map((specialty) => (
              <option key={specialty.id} value={specialty.id}>{specialty.name}</option>
            ))}
          </SelectField>
          <SelectField
            label="Profesional"
            name="professional"
            value={professionalId}
            disabled={!specialtyId}
            onChange={(e) => updateParams({ profesional: e.target.value })}
          >
            <option value="">Cualquier profesional</option>
            {professionals.data?.map((professional) => (
              <option key={professional.id} value={professional.id}>{fullName(professional)}</option>
            ))}
          </SelectField>
          <TextField
            label="Día"
            name="date"
            type="date"
            min={todayIso()}
            value={date}
            onChange={(e) => updateParams({ fecha: e.target.value })}
          />
        </section>

        <section className="stack" aria-label="Horarios disponibles">
          {error && <Alert>{error}</Alert>}
          {!specialtyId ? (
            <Alert kind="info">Elegí una especialidad para ver los horarios disponibles.</Alert>
          ) : (
            <SlotPicker
              key={refreshKey}
              date={date}
              specialtyId={specialtyId}
              professionalId={professionalId || undefined}
              selected={selected}
              onSelect={setSelected}
            />
          )}

          {selected && (
            <div className="card stack" aria-live="polite">
              <h2>Solicitud de turno</h2>
              <dl className="summary-list">
                <div><dt>Especialidad</dt><dd>{specialtyName}</dd></div>
                <div><dt>Profesional</dt><dd>{fullName(selected.professional)}</dd></div>
                <div><dt>Día y hora</dt><dd>{formatDateTime(selected.slot.startAt)}</dd></div>
                {profile && <div><dt>Paciente</dt><dd>{fullName(profile)}</dd></div>}
              </dl>

              {status !== 'ready' ? (
                <>
                  <Alert kind="info">Para confirmar el turno tenés que ingresar con tu cuenta.</Alert>
                  <div className="form-actions">
                    <Link className="btn" to={`/ingresar?redirect=${loginRedirect}`}>Ingresar</Link>
                    <Link className="btn btn-secondary" to={`/registro?redirect=${loginRedirect}`}>Crear cuenta</Link>
                  </div>
                </>
              ) : profile?.role !== 'PATIENT' ? (
                <Alert kind="warning">Solo las cuentas de pacientes pueden reservar turnos.</Alert>
              ) : (
                <button className="btn btn-block" onClick={handleConfirm} disabled={submitting}>
                  {submitting ? 'Confirmando…' : 'Confirmar turno'}
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
