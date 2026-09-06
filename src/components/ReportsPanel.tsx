import { differenceInDays, formatDateShort, getGoalMetrics, parseLocalDate } from '../data/domain';
import type { AppData, ActivityEvent } from '../data/types';

type ReportsPanelProps = {
  data: AppData;
};

function eventLabel(event: ActivityEvent): string {
  switch (event.type) {
    case 'milestone_completed':
      return `Completaste “${event.milestoneTitle ?? 'un hito'}”`;
    case 'milestone_reopened':
      return `Reabriste “${event.milestoneTitle ?? 'un hito'}”`;
    case 'goal_completed':
      return 'Marcaste el objetivo como completado';
    case 'goal_created':
      return 'Creaste este objetivo';
    default:
      return 'Actualizaste este objetivo';
  }
}

export function ReportsPanel({ data }: ReportsPanelProps) {
  const metrics = data.goals.map((goal) => ({ goal, metrics: getGoalMetrics(goal) }));
  const completedGoals = metrics.filter(({ metrics: item }) => item.status === 'completed').length;
  const averageProgress = metrics.length
    ? Math.round(metrics.reduce((total, item) => total + item.metrics.progressPercent, 0) / metrics.length)
    : 0;
  const overdueGoals = metrics.filter(({ goal, metrics: item }) => {
    return item.status !== 'completed' && differenceInDays(parseLocalDate(goal.deadline), new Date()) < 0;
  });
  const events = [...data.activityLog].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 8);

  return (
    <div className="reports-panel">
      <div className="reports-summary">
        <div><strong>{averageProgress}%</strong><span>progreso medio</span></div>
        <div><strong>{completedGoals}/{data.goals.length}</strong><span>objetivos completados</span></div>
        <div><strong>{data.activityLog.length}</strong><span>cambios registrados</span></div>
      </div>

      <div className="reports-grid">
          <div className="reports-block">
          <h3>Progreso por objetivo</h3>
          {metrics.length ? metrics.map(({ goal, metrics: item }) => (
            <div className="report-goal" key={goal.id}>
              <div className="report-goal__header"><span>{goal.title}</span><strong>{item.progressPercent}%</strong></div>
              <div className="progress-bar"><span className="progress-bar__fill" style={{ width: `${item.progressPercent}%` }} /></div>
            </div>
          )) : <p className="report-muted">Aún no hay objetivos para medir.</p>}
        </div>

        <div className="reports-block">
          <h3>En qué fallaste</h3>
          {overdueGoals.length ? overdueGoals.map(({ goal }) => (
            <div className="report-warning" key={goal.id}>
              <strong>{goal.title}</strong>
              <span>Venció el {formatDateShort(goal.deadline)} sin completarse.</span>
            </div>
          )) : <p className="report-muted">No hay objetivos vencidos. Sigue avanzando.</p>}
        </div>
      </div>

      <div className="reports-block reports-history">
        <h3>Histórico reciente</h3>
        {events.length ? events.map((event) => (
          <div className="history-item" key={event.id}>
            <span>{eventLabel(event)}</span>
            <small>{event.goalTitle} · {formatDateShort(event.createdAt.slice(0, 10))}</small>
          </div>
        )) : <p className="report-muted">Aquí aparecerán tus avances y retrocesos.</p>}
      </div>
    </div>
  );
}
