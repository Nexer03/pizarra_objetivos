import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { createId } from '../data/domain';
import type { GoalDraft, GoalDraftMilestone } from '../data/types';

type GoalFormModalProps = {
  open: boolean;
  initialDraft: GoalDraft;
  onClose: () => void;
  onSave: (draft: GoalDraft) => void;
};

function createEmptyMilestone(): GoalDraftMilestone {
  return {
    id: createId(),
    title: '',
    completed: false,
    completedAt: null,
  };
}

export function GoalFormModal({ open, initialDraft, onClose, onSave }: GoalFormModalProps) {
  const [draft, setDraft] = useState(initialDraft);
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    setDraft(initialDraft);
    setError(null);
    const frame = window.setTimeout(() => {
      titleInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(frame);
  }, [initialDraft, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const isEditing = draft.id !== null;

  const updateMilestone = (milestoneId: string, updater: (milestone: GoalDraftMilestone) => GoalDraftMilestone) => {
    setDraft((current) => ({
      ...current,
      milestones: current.milestones.map((milestone) =>
        milestone.id === milestoneId ? updater(milestone) : milestone,
      ),
    }));
  };

  const addMilestone = () => {
    setDraft((current) => ({
      ...current,
      milestones: [...current.milestones, createEmptyMilestone()],
    }));
  };

  const removeMilestone = (milestoneId: string) => {
    setDraft((current) => {
      const nextMilestones = current.milestones.filter((milestone) => milestone.id !== milestoneId);
      return {
        ...current,
        milestones: nextMilestones.length > 0 ? nextMilestones : [createEmptyMilestone()],
      };
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = draft.title.trim();
    const description = draft.description.trim();
    const deadline = draft.deadline.trim();
    const milestones = draft.milestones
      .map((milestone) => ({
        ...milestone,
        title: milestone.title.trim(),
      }))
      .filter((milestone) => milestone.title.length > 0);

    if (!title) {
      setError('Escribe un título para el objetivo.');
      return;
    }

    if (!deadline) {
      setError('Elige una fecha límite.');
      return;
    }

    if (milestones.length === 0) {
      setError('Añade al menos un hito.');
      return;
    }

    setError(null);
    onSave({
      ...draft,
      title,
      description,
      deadline,
      milestones,
    });
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-card__header">
          <div>
            <p className="eyebrow">{isEditing ? 'Editar objetivo' : 'Nuevo objetivo'}</p>
            <h2 id={titleId}>{isEditing ? 'Ajusta tu objetivo' : 'Crea un nuevo objetivo'}</h2>
            <p id={descriptionId} className="modal-card__description">
              Mantén los hitos pequeños y concretos. La app te mostrará el progreso automáticamente.
            </p>
          </div>
          <button type="button" className="button button--ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <form className="modal-card__body" onSubmit={handleSubmit}>
          <div className="field-grid field-grid--two">
            <label className="field">
              <span className="field__label">Título</span>
              <input
                ref={titleInputRef}
                type="text"
                className="input"
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.currentTarget.value }))}
                placeholder="Ej. Validar mi oferta de desarrollo"
              />
            </label>

            <label className="field">
              <span className="field__label">Fecha límite</span>
              <input
                type="date"
                className="input"
                value={draft.deadline}
                onChange={(event) => setDraft((current) => ({ ...current, deadline: event.currentTarget.value }))}
              />
            </label>
          </div>

          <label className="field">
            <span className="field__label">Descripción</span>
            <textarea
              className="textarea"
              rows={4}
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.currentTarget.value }))}
              placeholder="Describe qué quieres lograr y por qué importa."
            />
          </label>

          <div className="form-block">
            <div className="form-block__header">
              <div>
                <span className="field__label">Hitos</span>
                <p className="form-block__hint">Marca el progreso desde la tarjeta o la vista de esta semana.</p>
              </div>
              <button type="button" className="button button--secondary" onClick={addMilestone}>
                Añadir hito
              </button>
            </div>

            <div className="draft-milestones">
              {draft.milestones.map((milestone, index) => (
                <div key={milestone.id} className="draft-milestone">
                  <span className="draft-milestone__index">{index + 1}</span>
                  <input
                    type="text"
                    className="input"
                    value={milestone.title}
                    onChange={(event) =>
                      updateMilestone(milestone.id, (current) => ({
                        ...current,
                        title: event.currentTarget.value,
                      }))
                    }
                    placeholder="Ej. Crear una demo"
                  />
                  <button
                    type="button"
                    className="button button--ghost button--icon"
                    onClick={() => removeMilestone(milestone.id)}
                    aria-label={`Eliminar hito ${index + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error ? (
            <p className="inline-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="modal-card__footer">
            <button type="button" className="button button--secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="button button--primary">
              Guardar objetivo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
