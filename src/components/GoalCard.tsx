import type { Goal } from '../data/types';
import {
  differenceInDays,
  formatDateLong,
  formatDaysRemaining,
  parseLocalDate,
  getGoalMetrics,
  getGoalStatusLabel,
  getGoalStatusTone,
} from '../data/domain';

type GoalCardProps = {
  goal: Goal;
  isPrimary: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
  onSetPrimary: () => void;
  onToggleMilestone: (milestoneId: string, nextCompleted: boolean) => void;
};

export function GoalCard({
  goal,
  isPrimary,
  onEdit,
  onDelete,
  onComplete,
  onSetPrimary,
  onToggleMilestone,
}: GoalCardProps) {
  const metrics = getGoalMetrics(goal);
  const statusLabel = getGoalStatusLabel(metrics.status);
  const statusTone = getGoalStatusTone(metrics.status);
  const hasMilestones = goal.milestones.length > 0;
  const daysRemaining = differenceInDays(parseLocalDate(goal.deadline), new Date());

  return (
    <article className={`goal-card${isPrimary ? ' goal-card--primary' : ''}`}>
      <div className="goal-card__header">
        <div className="goal-card__heading">
          <div className="goal-card__title-row">
            <h3>{goal.title}</h3>
            {isPrimary ? <span className="pill pill--accent">Misión</span> : null}
          </div>
          <div className="goal-card__meta">
            <span className={`status-text status-text--${statusTone}`}>{statusLabel}</span>
            <span className="pill pill--muted">{formatDateLong(goal.deadline)}</span>
            <span className="pill pill--muted">{formatDaysRemaining(daysRemaining)}</span>
          </div>
        </div>
        <button type="button" className="button button--ghost" onClick={onEdit}>
          Editar
        </button>
      </div>

      <p className="goal-card__description">{goal.description || 'Sin descripción todavía.'}</p>

      <div className="goal-card__stats">
        <div className="goal-card__stat">
          <span>Progreso</span>
          <strong>{metrics.progressPercent}%</strong>
        </div>
        <div className="goal-card__stat">
          <span>Hitos</span>
          <strong>
            {metrics.completedMilestones}/{metrics.totalMilestones}
          </strong>
        </div>
      </div>

      <div className="progress-bar">
        <span className="progress-bar__fill" style={{ width: `${metrics.progressPercent}%` }} />
      </div>

      <div className="goal-card__milestones">
        <div className="goal-card__milestones-header">
          <span>Hitos</span>
          <span className="goal-card__milestones-count">{metrics.completedMilestones}/{metrics.totalMilestones}</span>
        </div>
        {hasMilestones ? (
          <ul className="milestone-list">
            {goal.milestones.map((milestone) => (
              <li key={milestone.id} className="milestone-item">
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={milestone.completed}
                    onChange={(event) => onToggleMilestone(milestone.id, event.currentTarget.checked)}
                  />
                  <span className={milestone.completed ? 'is-completed' : undefined}>{milestone.title}</span>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="goal-card__empty">Aún no hay hitos definidos para este objetivo.</p>
        )}
      </div>

      <div className="goal-card__footer">
        <div className="goal-card__actions">
          <button
            type="button"
            className="button button--primary"
            onClick={onComplete}
            disabled={metrics.status === 'completed'}
          >
            {metrics.status === 'completed' ? 'Completado' : 'Completar'}
          </button>
          {!isPrimary ? (
            <button type="button" className="button button--ghost" onClick={onSetPrimary}>
              Fijar como misión
            </button>
          ) : null}
        </div>
        <button type="button" className="button button--danger" onClick={onDelete}>
          Eliminar
        </button>
      </div>
    </article>
  );
}
