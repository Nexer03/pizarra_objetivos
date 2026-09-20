import { useState } from 'react';
import type { Goal } from '../data/types';
import {
  differenceInDays,
  formatDateLong,
  formatDateShort,
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
  const [isExpanded, setIsExpanded] = useState(false);
  const metrics = getGoalMetrics(goal);
  const statusLabel = getGoalStatusLabel(metrics.status);
  const statusTone = getGoalStatusTone(metrics.status);
  const hasMilestones = goal.milestones.length > 0;
  const daysRemaining = differenceInDays(parseLocalDate(goal.deadline), new Date());
  const detailsId = `goal-details-${goal.id}`;

  return (
    <article className={`goal-card${isPrimary ? ' goal-card--primary' : ''}`}>
      <div className="goal-card__header">
        <div className="goal-card__heading">
          <div className="goal-card__title-row">
            <h3>{goal.title}</h3>
            {isPrimary ? <span className="goal-card__mission-label">Misión principal</span> : null}
          </div>
          <div className="goal-card__meta">
            <span className={`status-text status-text--${statusTone}`}>{statusLabel}</span>
            <span className="goal-card__tracking">{goal.trackingMode === 'time' ? 'Por tiempo' : 'Por acciones'}</span>
            <span className="pill pill--muted">{formatDateLong(goal.deadline)}</span>
            <span className="pill pill--muted">{formatDaysRemaining(daysRemaining)}</span>
            <span className="goal-card__progress-summary">{metrics.progressPercent}%</span>
          </div>
        </div>
        <div className="goal-card__header-actions">
          <button type="button" className="button button--secondary goal-card__edit" onClick={onEdit}>
            Editar
          </button>
          <button
            type="button"
            className="button goal-card__toggle"
            aria-expanded={isExpanded}
            aria-controls={detailsId}
            aria-label={isExpanded ? `Contraer ${goal.title}` : `Ampliar ${goal.title}`}
            title={isExpanded ? 'Contraer objetivo' : 'Ampliar objetivo'}
            onClick={() => setIsExpanded((current) => !current)}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="m5 8 5 5 5-5" />
            </svg>
          </button>
        </div>
      </div>

      <div id={detailsId} className="goal-card__details" hidden={!isExpanded}>
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
                    <span className="milestone-item__content">
                      <span className={milestone.completed ? 'is-completed' : undefined}>{milestone.title}</span>
                      {milestone.scheduledDate ? <small>{formatDateShort(milestone.scheduledDate)}</small> : null}
                    </span>
                    {milestone.completed ? <span className="completion-arrow" aria-hidden="true">↗</span> : null}
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
      </div>
    </article>
  );
}
