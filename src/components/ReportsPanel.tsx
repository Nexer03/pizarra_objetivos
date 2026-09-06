import { differenceInDays, formatDateShort, getGoalMetrics, parseLocalDate } from '../data/domain';
import type { AppData } from '../data/types';

type ReportsPanelProps = {
  data: AppData;
};

export function ReportsPanel({ data }: ReportsPanelProps) {
  const metrics = data.goals.map((goal) => ({ goal, metrics: getGoalMetrics(goal) }));
  const completedGoals = metrics.filter(({ metrics: item }) => item.status === 'completed').length;
  const pendingGoals = data.goals.length - completedGoals;
  const averageProgress = metrics.length
    ? Math.round(metrics.reduce((total, item) => total + item.metrics.progressPercent, 0) / metrics.length)
    : 0;
  const overdueGoals = metrics.filter(({ goal, metrics: item }) => {
    return item.status !== 'completed' && differenceInDays(parseLocalDate(goal.deadline), new Date()) < 0;
  });
  return (
    <div className="reports-panel">
      <div className="reports-summary">
        <div><strong>{averageProgress}%</strong><span>progreso medio</span></div>
        <div><strong>{completedGoals}/{data.goals.length}</strong><span>objetivos completados</span></div>
        <div><strong>{pendingGoals}</strong><span>objetivos pendientes</span></div>
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
    </div>
  );
}
