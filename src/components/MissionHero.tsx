import type { Goal, MissionSnapshot } from '../data/types';
import {
  formatDateLong,
  formatDaysRemaining,
  formatMissionTimePercent,
  getMissionStateLabel,
  getMissionStateTone,
} from '../data/domain';

type MissionHeroProps = {
  goal: Goal | null;
  snapshot: MissionSnapshot | null;
  onEdit: () => void;
  onCreate: () => void;
  onComplete: () => void;
};

function metricLabel(value: string, label: string) {
  return (
    <div className="hero-metric">
      <strong className="hero-metric__value">{value}</strong>
      <span className="hero-metric__label">{label}</span>
    </div>
  );
}

export function MissionHero({ goal, snapshot, onEdit, onCreate, onComplete }: MissionHeroProps) {
  if (!goal || !snapshot) {
    return (
      <section className="hero-card hero-card--empty">
        <div className="hero-card__content">
          <p className="eyebrow">Misión principal</p>
          <h1>Define tu primer objetivo y vuelve este tablero útil desde hoy.</h1>
          <p className="hero-card__copy">
            Crea una misión clara para que Pizarra te recuerde cada día qué quieres conseguir y qué haces para lograrlo.
          </p>
        </div>
        <div className="hero-card__actions">
          <button type="button" className="button button--primary" onClick={onCreate}>
            Crear misión
          </button>
        </div>
      </section>
    );
  }

  const stateLabel = getMissionStateLabel(snapshot.state);
  const stateTone = getMissionStateTone(snapshot.state);
  const daysRemaining = Math.max(0, snapshot.daysRemaining);

  return (
    <section className={`hero-card hero-card--${stateTone}`}>
      <div className="hero-card__grid">
        <div className="hero-card__content">
          <p className="eyebrow">Misión principal</p>
          <div className="hero-card__title-row">
            <h1>{goal.title}</h1>
            <span className={`status-text status-text--${stateTone}`}>{stateLabel}</span>
          </div>
          <p className="hero-card__copy">{goal.description || 'Sin descripción todavía.'}</p>
          <div className="hero-card__meta">
            <span className="pill pill--muted">Límite: {formatDateLong(goal.deadline)}</span>
            <span className="pill pill--muted">{formatDaysRemaining(snapshot.daysRemaining)}</span>
            <span className="pill pill--muted">{formatMissionTimePercent(snapshot.timeProgressPercent)}</span>
          </div>
          <div className="hero-progress">
            <div className="hero-progress__header">
              <span>Progreso temporal</span>
              <strong>{snapshot.timeProgressPercent}%</strong>
            </div>
            <div className="progress-bar">
              <span className="progress-bar__fill" style={{ width: `${snapshot.timeProgressPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="hero-card__sidebar">
          {metricLabel(`${daysRemaining}`, 'días restantes')}
          {metricLabel(`${snapshot.completedMilestones}/${snapshot.totalMilestones}`, 'hitos completados')}
          {metricLabel(`${snapshot.progressPercent}%`, 'avance de hitos')}
        </div>
      </div>

      <div className="hero-card__footer">
        <div className="hero-card__actions">
          <button type="button" className="button button--secondary" onClick={onEdit}>
            Editar misión
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={onComplete}
            disabled={snapshot.status === 'completed'}
          >
            {snapshot.status === 'completed' ? 'Completada' : 'Marcar completada'}
          </button>
        </div>
        <p className="hero-card__hint">Tu foco ahora mismo es esta misión. Todo lo demás debe empujarla.</p>
      </div>
    </section>
  );
}
