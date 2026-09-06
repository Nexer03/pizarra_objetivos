import type { AppData, Goal, GoalMetrics, GoalStatus, MissionSnapshot, UpcomingAction } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

export function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toLocalDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function differenceInDays(later: Date, earlier: Date): number {
  const laterDay = toLocalDate(later).getTime();
  const earlierDay = toLocalDate(earlier).getTime();
  return Math.round((laterDay - earlierDay) / DAY_MS);
}

export function formatDateLong(value: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parseLocalDate(value));
}

export function formatDateShort(value: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parseLocalDate(value));
}

export function formatDaysRemaining(daysRemaining: number): string {
  if (daysRemaining === 0) {
    return 'vence hoy';
  }

  if (daysRemaining > 0) {
    return `faltan ${daysRemaining} días`;
  }

  return `venció hace ${Math.abs(daysRemaining)} días`;
}

export function formatMissionTimePercent(percent: number): string {
  return `${Math.max(0, Math.min(100, Math.round(percent)))}% del tiempo`;
}

export function getGoalMetrics(goal: Goal): GoalMetrics {
  const totalMilestones = goal.milestones.length;
  const completedMilestones = goal.milestones.filter((milestone) => milestone.completed).length;
  const start = parseLocalDate(goal.createdAt);
  const deadline = parseLocalDate(goal.deadline);
  const totalDays = Math.max(1, differenceInDays(deadline, start));
  const elapsedDays = clamp(differenceInDays(new Date(), start), 0, totalDays);
  const progressPercent = goal.trackingMode === 'time'
    ? Math.round((elapsedDays / totalDays) * 100)
    : totalMilestones === 0 ? 0 : Math.round((completedMilestones / totalMilestones) * 100);

  let status: GoalStatus = 'pending';

  if (goal.completed || (goal.trackingMode === 'actions' && totalMilestones > 0 && completedMilestones === totalMilestones)) {
    status = 'completed';
  } else if (completedMilestones > 0 || progressPercent > 0) {
    status = 'in_progress';
  }

  return {
    status,
    completedMilestones,
    totalMilestones,
    progressPercent,
  };
}

export function getGoalStatusLabel(status: GoalStatus): string {
  switch (status) {
    case 'completed':
      return 'Completado';
    case 'in_progress':
      return 'En progreso';
    default:
      return 'Pendiente';
  }
}

export function getGoalStatusTone(status: GoalStatus): 'success' | 'warning' | 'neutral' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function sortGoals(goals: Goal[], primaryGoalId: string | null): Goal[] {
  return [...goals].sort((left, right) => {
    if (left.id === primaryGoalId && right.id !== primaryGoalId) {
      return -1;
    }

    if (right.id === primaryGoalId && left.id !== primaryGoalId) {
      return 1;
    }

    const byDeadline = parseLocalDate(left.deadline).getTime() - parseLocalDate(right.deadline).getTime();
    if (byDeadline !== 0) {
      return byDeadline;
    }

    return parseLocalDate(left.createdAt).getTime() - parseLocalDate(right.createdAt).getTime();
  });
}

export function getPrimaryGoal(data: AppData): Goal | null {
  const primary = data.goals.find((goal) => goal.id === data.primaryGoalId);
  return primary ?? data.goals[0] ?? null;
}

export function getMissionSnapshot(goal: Goal, now = new Date()): MissionSnapshot {
  const metrics = getGoalMetrics(goal);
  const today = toLocalDate(now);
  const createdAt = parseLocalDate(goal.createdAt);
  const deadline = parseLocalDate(goal.deadline);
  const totalDays = Math.max(1, differenceInDays(deadline, createdAt));
  const elapsedDays = clamp(differenceInDays(today, createdAt), 0, totalDays);
  const timeProgressPercent = Math.round((elapsedDays / totalDays) * 100);
  const daysRemaining = differenceInDays(deadline, today);

  let state: MissionSnapshot['state'] = 'active';
  if (metrics.status === 'completed') {
    state = 'completed';
  } else if (daysRemaining < 0) {
    state = 'overdue';
  } else if (daysRemaining <= 14) {
    state = 'urgent';
  }

  return {
    ...metrics,
    daysRemaining,
    timeProgressPercent,
    elapsedDays,
    totalDays,
    state,
  };
}

export function getMissionStateLabel(state: MissionSnapshot['state']): string {
  switch (state) {
    case 'completed':
      return 'Completada';
    case 'overdue':
      return 'Atrasada';
    case 'urgent':
      return 'Urgente';
    default:
      return 'En marcha';
  }
}

export function getMissionStateTone(state: MissionSnapshot['state']): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (state) {
    case 'completed':
      return 'success';
    case 'urgent':
      return 'warning';
    case 'overdue':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function getUpcomingActions(data: AppData, limit = 4): UpcomingAction[] {
  const sortedGoals = sortGoals(data.goals, data.primaryGoalId);
  const upcoming: UpcomingAction[] = [];

  for (const goal of sortedGoals) {
    for (const milestone of goal.milestones) {
      if (milestone.completed) {
        continue;
      }

      upcoming.push({
        goalId: goal.id,
        milestoneId: milestone.id,
        goalTitle: goal.title,
        milestoneTitle: milestone.title,
        goalDeadline: goal.deadline,
        isPrimary: goal.id === data.primaryGoalId,
      });

      if (upcoming.length >= limit) {
        return upcoming;
      }
    }
  }

  return upcoming;
}
