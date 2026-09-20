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
                    {item.goalTitle} · {formatDateShort(item.scheduledDate)}
                    {item.isPrimary ? ' · misión principal' : ''}
                  </span>
                </div>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state empty-state--soft">
          <p className="empty-state__title">No hay acciones programadas esta semana.</p>
          <p className="empty-state__copy">
            Edita un objetivo y asigna fechas a los hitos que quieras mover esta semana.
          </p>
        </div>
      )}
    </div>
  );
}
