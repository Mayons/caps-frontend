import { Link, useSearchParams } from 'react-router-dom';
import { capsApi } from '../api/caps';
import { useAsync } from '../utils/useAsync';
import { fullName } from '../utils/dates';
import { SelectField } from '../components/Field';
import { Alert, EmptyState, Loading, PageHeader } from '../components/Feedback';
import { useAuth } from '../auth/AuthContext';

export function ProfessionalsPage() {
  const [params, setParams] = useSearchParams();
  const specialtyId = params.get('especialidad') ?? '';
  const { status, profile } = useAuth();
  const canBook = status !== 'ready' || profile?.role === 'PATIENT';

  const specialties = useAsync(() => capsApi.listSpecialties(), []);
  const professionals = useAsync(() => capsApi.listProfessionals(specialtyId || undefined), [specialtyId]);

  return (
    <>
      <PageHeader title="Profesionales" subtitle="Conocé quiénes atienden en el CAPS y sacá un turno." />

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <SelectField
          label="Filtrar por especialidad"
          name="specialty"
          value={specialtyId}
          onChange={(e) => setParams(e.target.value ? { especialidad: e.target.value } : {})}
        >
          <option value="">Todas las especialidades</option>
          {specialties.data?.map((specialty) => (
            <option key={specialty.id} value={specialty.id}>{specialty.name}</option>
          ))}
        </SelectField>
      </div>

      {professionals.loading && <Loading />}
      {professionals.error && <Alert>{professionals.error}</Alert>}
      {professionals.data?.length === 0 && <EmptyState title="No hay profesionales para esta especialidad" />}

      <div className="grid cards">
        {professionals.data?.map((professional) => (
          <article key={professional.id} className="card stack">
            <div>
              <h2>{fullName(professional)}</h2>
              <ul className="chip-list" aria-label="Especialidades">
                {professional.specialties.map((specialty) => (
                  <li key={specialty.id} className="chip">{specialty.name}</li>
                ))}
              </ul>
            </div>
            {canBook && (
              <Link
                className="btn"
                to={`/turnos/nuevo?profesional=${professional.id}&especialidad=${
                  professional.specialties.some((s) => s.id === specialtyId) ? specialtyId : professional.specialties[0]?.id ?? ''
                }`}
              >
                Ver horarios
              </Link>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
