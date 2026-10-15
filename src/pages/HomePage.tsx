import { Link } from 'react-router-dom';
import { capsApi } from '../api/caps';
import { useAuth } from '../auth/AuthContext';
import { useAsync } from '../utils/useAsync';
import { Alert, Loading } from '../components/Feedback';

export function HomePage() {
  const { status, profile } = useAuth();
  const specialties = useAsync(() => capsApi.listSpecialties(), []);
  const isPatientOrGuest = status !== 'ready' || profile?.role === 'PATIENT';

  return (
    <>
      <section className="hero">
        <h1>Turnos del CAPS Las Isletillas</h1>
        <p>Sacá tu turno con los profesionales del Centro de Atención Primaria de la Salud desde el celular o la computadora.</p>
        <div className="row">
          {isPatientOrGuest && (
            <Link to="/turnos/nuevo" className="btn btn-light">Sacar un turno</Link>
          )}
          <Link to="/profesionales" className="btn btn-secondary">Ver profesionales</Link>
        </div>
      </section>

      <div className="split">
        <section className="card">
          <h2>¿Cómo saco un turno?</h2>
          <ol className="steps">
            <li><span>Creá tu cuenta o ingresá con tu email.</span></li>
            <li><span>Elegí la especialidad y, si querés, el profesional.</span></li>
            <li><span>Elegí el día y el horario disponible.</span></li>
            <li><span>Confirmá. Vas a ver el número de tu turno y podés consultarlo en “Mis turnos”.</span></li>
          </ol>
        </section>

        <section className="card">
          <h2>Especialidades</h2>
          {specialties.loading && <Loading />}
          {specialties.error && <Alert>{specialties.error}</Alert>}
          {specialties.data && specialties.data.length === 0 && <p className="muted">Todavía no hay especialidades cargadas.</p>}
          <ul className="list">
            {specialties.data?.map((specialty) => (
              <li key={specialty.id}>
                <Link to={`/profesionales?especialidad=${specialty.id}`}><strong>{specialty.name}</strong></Link>
                {specialty.description && <p className="muted small" style={{ margin: 0 }}>{specialty.description}</p>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
