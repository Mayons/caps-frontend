import { useState, type FormEvent } from 'react';
import { capsApi } from '../../api/caps';
import { errorMessage } from '../../api/client';
import type { Specialty } from '../../api/types';
import { useAsync } from '../../utils/useAsync';
import { TextField } from '../../components/Field';
import { Alert, EmptyState, Loading, PageHeader, StatusBadge } from '../../components/Feedback';

export function SpecialtiesAdminPage() {
  const specialties = useAsync(() => capsApi.listAllSpecialties(), []);
  const [editing, setEditing] = useState<Specialty | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setEditing(null);
    setName('');
    setDescription('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      setMessage({ kind: 'error', text: 'El nombre debe tener al menos 2 caracteres.' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    const data = { name: name.trim(), description: description.trim() || null };
    try {
      if (editing) await capsApi.updateSpecialty(editing.id, data);
      else await capsApi.createSpecialty(data);
      setMessage({ kind: 'success', text: editing ? 'Especialidad actualizada.' : 'Especialidad creada.' });
      reset();
      specialties.reload();
    } catch (err) {
      setMessage({ kind: 'error', text: errorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (specialty: Specialty) => {
    try {
      await capsApi.updateSpecialty(specialty.id, { isActive: !specialty.isActive });
      specialties.reload();
    } catch (err) {
      setMessage({ kind: 'error', text: errorMessage(err) });
    }
  };

  return (
    <>
      <PageHeader title="Especialidades" />
      <div className="split sidebar-left">
        <form className="card form" onSubmit={handleSubmit}>
          <h2>{editing ? 'Editar especialidad' : 'Nueva especialidad'}</h2>
          <TextField label="Nombre" name="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
          <TextField label="Descripción (opcional)" name="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
          <div className="form-actions">
            <button className="btn" disabled={submitting}>{editing ? 'Guardar' : 'Crear'}</button>
            {editing && <button type="button" className="btn btn-secondary" onClick={reset}>Cancelar</button>}
          </div>
        </form>

        <section className="stack">
          {message && <Alert kind={message.kind}>{message.text}</Alert>}
          {specialties.loading && <Loading />}
          {specialties.error && <Alert>{specialties.error}</Alert>}
          {specialties.data?.length === 0 && <EmptyState title="Todavía no hay especialidades" />}
          {specialties.data && specialties.data.length > 0 && (
            <table className="responsive-table">
              <thead><tr><th>Nombre</th><th>Descripción</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {specialties.data.map((specialty) => (
                  <tr key={specialty.id}>
                    <td data-label="Nombre">{specialty.name}</td>
                    <td data-label="Descripción">{specialty.description ?? '—'}</td>
                    <td data-label="Estado"><StatusBadge status={specialty.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                    <td className="actions">
                      <button className="btn btn-secondary" onClick={() => { setEditing(specialty); setName(specialty.name); setDescription(specialty.description ?? ''); }}>Editar</button>
                      <button className={`btn ${specialty.isActive ? 'btn-danger' : 'btn-secondary'}`} onClick={() => toggleActive(specialty)}>
                        {specialty.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}
