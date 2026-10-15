import { capsApi } from '../api/caps';
import type { PublicProfessional, Slot } from '../api/types';
import { useAsync } from '../utils/useAsync';
import { formatTime, fullName } from '../utils/dates';
import { Alert, EmptyState, Loading } from './Feedback';

export interface SelectedSlot {
  professional: PublicProfessional;
  slot: Slot;
}

/**
 * Muestra los horarios libres de un día. Los horarios vienen calculados por
 * el backend (que conoce la duración de los turnos y las reservas existentes).
 */
export function SlotPicker({
  date,
  specialtyId,
  professionalId,
  selected,
  onSelect,
}: {
  date: string;
  specialtyId?: string;
  professionalId?: string;
  selected: SelectedSlot | null;
  onSelect: (value: SelectedSlot) => void;
}) {
  const { data, error, loading } = useAsync(
    () => capsApi.listSlots({ date, specialtyId, professionalId }),
    [date, specialtyId, professionalId],
  );

  if (loading) return <Loading label="Buscando horarios…" />;
  if (error) return <Alert>{error}</Alert>;
  if (!data || data.professionals.length === 0) {
    return (
      <EmptyState title="No hay horarios libres para ese día">
        <p className="muted">Probá con otra fecha u otro profesional.</p>
      </EmptyState>
    );
  }

  return (
    <div className="stack">
      <p className="muted small">Cada turno dura {data.durationMinutes} minutos.</p>
      {data.professionals.map((professional) => (
        <div key={professional.id} className="card">
          <h3>{fullName(professional)}</h3>
          <div className="slot-grid" role="group" aria-label={`Horarios de ${fullName(professional)}`}>
            {professional.slots.map((slot) => {
              const isSelected = selected?.professional.id === professional.id && selected.slot.startAt === slot.startAt;
              return (
                <button
                  key={slot.startAt}
                  type="button"
                  className="slot"
                  aria-pressed={isSelected}
                  onClick={() => onSelect({ professional, slot })}
                >
                  {formatTime(slot.startAt)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
