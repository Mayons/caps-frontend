import { Link, useParams } from 'react-router-dom';
import { capsApi } from '../api/caps';
import { useAsync } from '../utils/useAsync';
import { formatDateTime, fullName } from '../utils/dates';
import { Alert, Loading } from '../components/Feedback';

export function ConfirmationPage() {
  const { id = '' } = useParams();
  const { data, error, loading } = useAsync(() => capsApi.getAppointment(id), [id]);

  if (loading) return <Loading />;
  if (error || !data) return <Alert>{error ?? 'No se encontró el turno'}</Alert>;

  return (
    <section className="card auth-card stack">
      <Alert kind="success">¡Listo! Tu turno quedó confirmado.</Alert>
      <div>
        <p className="muted small" style={{ marginBottom: 4 }}>Número de turno</p>
        <p className="confirmation-id mono">{data.id}</p>
      </div>
      <dl className="summary-list">
        <div><dt>Día y hora</dt><dd>{formatDateTime(data.startAt)}</dd></div>
        <div><dt>Profesional</dt><dd>{fullName(data.professional)}</dd></div>
        <div><dt>Especialidad</dt><dd>{data.specialty.name}</dd></div>
      </dl>
      <p className="muted small">Si no podés asistir, cancelá el turno desde “Mis turnos” para que otra persona pueda usarlo.</p>
      <div className="form-actions">
        <Link className="btn" to="/mis-turnos">Ver mis turnos</Link>
        <Link className="btn btn-secondary" to="/">Volver al inicio</Link>
      </div>
    </section>
  );
}
