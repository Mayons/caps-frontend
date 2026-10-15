import { useState, type FormEvent } from 'react';
import { capsApi, type ProfessionalData } from '../../api/caps';
import { errorMessage } from '../../api/client';
import type { ManagedProfessional } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { useAsync } from '../../utils/useAsync';
import { formatDateTime, fullName } from '../../utils/dates';
import { hasErrors, isEmail, isPhone, type Errors } from '../../utils/validation';
import { CheckboxField, TextField } from '../../components/Field';
import { Alert, EmptyState, Loading, PageHeader, Pager, StatusBadge } from '../../components/Feedback';

const emptyForm: ProfessionalData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  licenseNumber: null,
  isActive: true,
  allowAvailabilityManagement: false,
  specialtyIds: [],
};

function validate(form: ProfessionalData): Errors<ProfessionalData> {
  return {
    firstName: form.firstName.trim() ? undefined : 'Obligatorio',
    lastName: form.lastName.trim() ? undefined : 'Obligatorio',
    email: isEmail(form.email) ? undefined : 'Email inválido',
    phone: isPhone(form.phone) ? undefined : 'Teléfono inválido',
    specialtyIds: form.specialtyIds.length > 0 ? undefined : 'Elegí al menos una especialidad',
  };
}

export function ProfessionalsAdminPage() {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const professionals = useAsync(() => capsApi.listManagedProfessionals({ search: search || undefined, page }), [search, page]);
  const specialties = useAsync(() => capsApi.listSpecialties(), []);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfessionalData>(emptyForm);
  const [errors, setErrors] = useState<Errors<ProfessionalData>>({});
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [invitationLink, setInvitationLink] = useState<{ name: string; url: string; expiresAt: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
  };

  const startEditing = (professional: ManagedProfessional) => {
    setEditingId(professional.id);
    setForm({
      firstName: professional.firstName,
      lastName: professional.lastName,
      email: professional.email,
      phone: professional.phone,
      licenseNumber: professional.licenseNumber,
      isActive: professional.isActive,
      allowAvailabilityManagement: professional.allowAvailabilityManagement,
      specialtyIds: professional.specialties.map((s) => s.id),
    });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSpecialty = (id: string) =>
    setForm((current) => ({
      ...current,
      specialtyIds: current.specialtyIds.includes(id)
        ? current.specialtyIds.filter((sid) => sid !== id)
        : [...current.specialtyIds, id],
    }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (hasErrors(found)) return;
    setSubmitting(true);
    setMessage(null);
    const data = { ...form, licenseNumber: form.licenseNumber?.trim() || null };
    try {
      if (editingId) await capsApi.updateProfessional(editingId, data);
      else await capsApi.createProfessional(data);
      setMessage({ kind: 'success', text: editingId ? 'Profesional actualizado.' : 'Profesional creado.' });
      reset();
      professionals.reload();
    } catch (err) {
      setMessage({ kind: 'error', text: errorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  const runAction = async (action: () => Promise<unknown>, success: string) => {
    setMessage(null);
    try {
      await action();
      setMessage({ kind: 'success', text: success });
      professionals.reload();
    } catch (err) {
      setMessage({ kind: 'error', text: errorMessage(err) });
    }
  };

  const handleInvite = async (professional: ManagedProfessional) => {
    setMessage(null);
    try {
      const invitation = await capsApi.createInvitation(professional.id);
      // El enlace se muestra una sola vez: el backend solo guarda su hash.
      setInvitationLink({
        name: fullName(professional),
        url: `${window.location.origin}/invitacion?token=${encodeURIComponent(invitation.token)}`,
        expiresAt: invitation.expiresAt,
      });
      professionals.reload();
    } catch (err) {
      setMessage({ kind: 'error', text: errorMessage(err) });
    }
  };

  return (
    <>
      <PageHeader title="Gestionar profesionales" />

      <div className="split sidebar-left">
        <form className="card form" onSubmit={handleSubmit} noValidate>
          <h2>{editingId ? 'Editar profesional' : 'Nuevo profesional'}</h2>
          <TextField label="Nombre" name="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} error={errors.firstName} />
          <TextField label="Apellido" name="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} error={errors.lastName} />
          <TextField label="Email" name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} hint="Con este email el profesional vincula su cuenta" />
          <TextField label="Teléfono" name="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} />
          <TextField label="Matrícula (opcional)" name="licenseNumber" value={form.licenseNumber ?? ''} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />

          <fieldset className="field" style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 600 }}>Especialidades</legend>
            {specialties.data?.map((specialty) => (
              <CheckboxField key={specialty.id} label={specialty.name} checked={form.specialtyIds.includes(specialty.id)} onChange={() => toggleSpecialty(specialty.id)} />
            ))}
            {errors.specialtyIds && <small className="field-error">{errors.specialtyIds}</small>}
          </fieldset>

          <CheckboxField label="Activo" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          <CheckboxField label="Puede cargar su propia disponibilidad" checked={form.allowAvailabilityManagement} onChange={(e) => setForm({ ...form, allowAvailabilityManagement: e.target.checked })} />

          <div className="form-actions">
            <button className="btn" disabled={submitting}>{editingId ? 'Guardar cambios' : 'Crear profesional'}</button>
            {editingId && <button type="button" className="btn btn-secondary" onClick={reset}>Cancelar</button>}
          </div>
        </form>

        <section className="stack">
          {message && <Alert kind={message.kind}>{message.text}</Alert>}
          {invitationLink && (
            <div className="card stack">
              <Alert kind="warning">
                Enlace de invitación para <strong>{invitationLink.name}</strong>. Se muestra <strong>una sola vez</strong>: copialo y envialo
                por un canal privado. Vence el {formatDateTime(invitationLink.expiresAt)}.
              </Alert>
              <p className="mono small">{invitationLink.url}</p>
              <div className="form-actions">
                <button className="btn" onClick={() => navigator.clipboard?.writeText(invitationLink.url)}>Copiar enlace</button>
                <button className="btn btn-secondary" onClick={() => setInvitationLink(null)}>Listo, ocultar</button>
              </div>
            </div>
          )}

          <TextField label="Buscar" name="search" type="search" placeholder="Nombre, apellido o email" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />

          {professionals.loading && <Loading />}
          {professionals.error && <Alert>{professionals.error}</Alert>}
          {professionals.data?.items.length === 0 && <EmptyState title="No hay profesionales" />}
          {professionals.data && professionals.data.items.length > 0 && (
            <table className="responsive-table">
              <thead><tr><th>Profesional</th><th>Especialidades</th><th>Estado</th><th>Cuenta</th><th></th></tr></thead>
              <tbody>
                {professionals.data.items.map((professional) => (
                  <tr key={professional.id}>
                    <td data-label="Profesional">
                      <strong>{fullName(professional)}</strong>
                      <br />
                      <span className="muted small">{professional.email}</span>
                    </td>
                    <td data-label="Especialidades">{professional.specialties.map((s) => s.name).join(', ')}</td>
                    <td data-label="Estado"><StatusBadge status={professional.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                    <td data-label="Cuenta">
                      {professional.hasLinkedAccount
                        ? <span className="badge badge-active">Vinculada</span>
                        : professional.pendingInvitationExpiresAt
                          ? <span className="badge badge-info">Invitación pendiente</span>
                          : <span className="badge badge-inactive">Sin cuenta</span>}
                    </td>
                    <td className="actions">
                      <button className="btn btn-secondary" onClick={() => startEditing(professional)}>Editar</button>
                      {!professional.hasLinkedAccount && professional.isActive && (
                        <button className="btn btn-secondary" onClick={() => handleInvite(professional)}>
                          {professional.pendingInvitationExpiresAt ? 'Nueva invitación' : 'Invitar'}
                        </button>
                      )}
                      {professional.pendingInvitationExpiresAt && (
                        <button className="btn btn-danger" onClick={() => runAction(() => capsApi.revokeInvitations(professional.id), 'Invitación revocada.')}>
                          Revocar invitación
                        </button>
                      )}
                      {profile?.role === 'SUPER_ADMIN' && professional.hasLinkedAccount && (
                        <button
                          className="btn btn-danger"
                          onClick={() =>
                            window.confirm('¿Revocar el acceso? La cuenta pasa a ser de paciente; el profesional y sus turnos se conservan.') &&
                            runAction(() => capsApi.revokeProfessionalAccess(professional.id), 'Acceso revocado.')
                          }
                        >
                          Revocar acceso
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {professionals.data && <Pager {...professionals.data} onChange={setPage} />}
        </section>
      </div>
    </>
  );
}
