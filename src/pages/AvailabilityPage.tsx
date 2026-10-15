import { useState, type FormEvent } from 'react';
import { capsApi } from '../api/caps';
import { errorMessage } from '../api/client';
import type { AvailabilityBlock } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { useAsync } from '../utils/useAsync';
import { argentinaDateTime, formatDate, formatTime, fullName, toDateInput, toTimeInput, todayIso } from '../utils/dates';
import { SelectField, TextField } from '../components/Field';
import { Alert, EmptyState, Loading, PageHeader } from '../components/Feedback';

interface BlockForm {
  date: string;
  from: string;
  to: string;
}

/**
 * Gestión de bloques de disponibilidad.
 * - Gestores y administradores eligen el profesional.
 * - Un profesional con permiso solo gestiona su propia disponibilidad.
 */
export function AvailabilityPage() {
  const { profile } = useAuth();
  const isProfessional = profile?.role === 'PROFESSIONAL';
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const professionalId = isProfessional ? profile?.professionalId ?? '' : selectedProfessional;

  const professionals = useAsync(
    () => (isProfessional ? Promise.resolve([]) : capsApi.listProfessionals()),
    [isProfessional],
  );
  const blocks = useAsync(
    () => (professionalId ? capsApi.listBlocks({ professionalId }) : Promise.resolve([])),
    [professionalId],
  );

  const [form, setForm] = useState<BlockForm>({ date: todayIso(), from: '08:00', to: '12:00' });
  const [editing, setEditing] = useState<AvailabilityBlock | null>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setEditing(null);
    setForm({ date: todayIso(), from: '08:00', to: '12:00' });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!professionalId) return;
    if (form.to <= form.from) {
      setMessage({ kind: 'error', text: 'La hora de fin debe ser posterior a la de inicio.' });
      return;
    }
    const startAt = argentinaDateTime(form.date, form.from);
    const endAt = argentinaDateTime(form.date, form.to);
    setSubmitting(true);
    setMessage(null);
    try {
      if (editing) {
        await capsApi.updateBlock(editing.id, { startAt, endAt });
        setMessage({ kind: 'success', text: 'Bloque actualizado.' });
      } else {
        await capsApi.createBlock({ professionalId, startAt, endAt });
        setMessage({ kind: 'success', text: 'Bloque creado. Los pacientes ya pueden reservar en ese horario.' });
      }
      resetForm();
      blocks.reload();
    } catch (err) {
      setMessage({ kind: 'error', text: errorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (block: AvailabilityBlock) => {
    setEditing(block);
    setForm({ date: toDateInput(block.startAt), from: toTimeInput(block.startAt), to: toTimeInput(block.endAt) });
    setMessage(null);
  };

  const handleDeactivate = async (block: AvailabilityBlock) => {
    if (!window.confirm('¿Desactivar este bloque? Los pacientes ya no podrán reservar en ese horario.')) return;
    try {
      await capsApi.deactivateBlock(block.id);
      setMessage({ kind: 'success', text: 'Bloque desactivado.' });
      blocks.reload();
    } catch (err) {
      setMessage({ kind: 'error', text: errorMessage(err) });
    }
  };

  return (
    <>
      <PageHeader title="Disponibilidad" subtitle="Bloques horarios en los que se pueden reservar turnos." />

      <div className="split sidebar-left">
        <section className="card form">
          {!isProfessional && (
            <SelectField
              label="Profesional"
              name="professional"
              value={selectedProfessional}
              onChange={(e) => { setSelectedProfessional(e.target.value); resetForm(); }}
            >
              <option value="">Elegí un profesional</option>
              {professionals.data?.map((professional) => (
                <option key={professional.id} value={professional.id}>{fullName(professional)}</option>
              ))}
            </SelectField>
          )}

          {professionalId && (
            <form className="form" onSubmit={handleSubmit}>
              <h2>{editing ? 'Modificar bloque' : 'Nuevo bloque'}</h2>
              <TextField label="Día" name="date" type="date" min={todayIso()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              <div className="form-grid two">
                <TextField label="Desde" name="from" type="time" step={300} value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} required />
                <TextField label="Hasta" name="to" type="time" step={300} value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} required />
              </div>
              <div className="form-actions">
                <button className="btn" disabled={submitting}>{editing ? 'Guardar cambios' : 'Crear bloque'}</button>
                {editing && <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar edición</button>}
              </div>
            </form>
          )}
        </section>

        <section className="stack">
          {message && <Alert kind={message.kind}>{message.text}</Alert>}
          {!professionalId && <Alert kind="info">Elegí un profesional para ver y crear su disponibilidad.</Alert>}
          {blocks.loading && professionalId && <Loading />}
          {blocks.error && <Alert>{blocks.error}</Alert>}
          {professionalId && blocks.data?.length === 0 && <EmptyState title="No hay bloques futuros" />}
          {blocks.data && blocks.data.length > 0 && (
            <table className="responsive-table">
              <thead>
                <tr><th>Día</th><th>Horario</th><th>Turnos confirmados</th><th></th></tr>
              </thead>
              <tbody>
                {blocks.data.map((block) => {
                  const started = new Date(block.startAt) <= new Date();
                  return (
                    <tr key={block.id}>
                      <td data-label="Día">{formatDate(block.startAt)}</td>
                      <td data-label="Horario">{formatTime(block.startAt)} – {formatTime(block.endAt)}</td>
                      <td data-label="Turnos confirmados">{block.confirmedAppointments}</td>
                      <td className="actions">
                        {!started && <button className="btn btn-secondary" onClick={() => startEditing(block)}>Modificar</button>}
                        <button className="btn btn-danger" onClick={() => handleDeactivate(block)}>Desactivar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}
