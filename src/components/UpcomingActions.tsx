import type { UpcomingAction } from '../data/types';
import { formatDateShort } from '../data/domain';

type UpcomingActionsProps = {
  items: UpcomingAction[];
  onToggleMilestone: (goalId: string, milestoneId: string) => void;
};

export function UpcomingActions({ items, onToggleMilestone }: UpcomingActionsProps) {
  return (
    <div className="weekly-list">
      {items.length > 0 ? (
        <ul className="weekly-list__items">
          {items.map((item) => (
            <li key={`${item.goalId}-${item.milestoneId}`} className="weekly-item">
              <label className="weekly-item__row">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => onToggleMilestone(item.goalId, item.milestoneId)}
                />
                <div className="weekly-item__content">
                  <span className="weekly-item__title">{item.milestoneTitle}</span>
                  <span className="weekly-item__meta">
                    {item.goalTitle} · {formatDateShort(item.goalDeadline)}
                    {item.isPrimary ? ' · misión principal' : ''}
                  </span>
                </div>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state empty-state--soft">
          <p className="empty-state__title">No hay acciones concretas todavía.</p>
          <p className="empty-state__copy">
            Añade hitos a tus objetivos y esta sección te enseñará qué mover primero esta semana.
          </p>
        </div>
      )}
    </div>
  );
}
