import { createId } from './domain';
import { DEFAULT_APP_NAME, PRIMARY_MISSION_DEADLINE } from './defaults';
import { APP_SCHEMA_VERSION, type ActivityEvent, type AppData, type AppSettings, type Goal, type Milestone } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asTrimmedString(value: unknown): string | null {
  const result = asString(value)?.trim();
  return result && result.length > 0 ? result : null;
}

function isValidDateInput(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeDateString(value: unknown, fallback: string): string {
  const raw = asString(value);
  return raw && isValidDateInput(raw) ? raw : fallback;
}

function normalizeTimestamp(value: unknown, fallback: string): string {
  const raw = asString(value);
  return raw ? raw : fallback;
}

function normalizeMilestone(value: unknown, nowIso: string): Milestone | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = asTrimmedString(value.title);
  if (!title) {
    return null;
  }

  const completed = value.completed === true;
  return {
    id: asString(value.id) ?? createId(),
    title,
    completed,
    completedAt: completed ? normalizeTimestamp(value.completedAt, nowIso) : null,
  };
}

function normalizeGoal(value: unknown, nowIso: string): Goal | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = asTrimmedString(value.title);
  if (!title) {
    return null;
  }

  const milestones = Array.isArray(value.milestones)
    ? value.milestones.map((item) => normalizeMilestone(item, nowIso)).filter((item): item is Milestone => item !== null)
    : [];

  return {
    id: asString(value.id) ?? createId(),
    title,
    description: asString(value.description)?.trim() ?? '',
    deadline: normalizeDateString(value.deadline, PRIMARY_MISSION_DEADLINE),
    trackingMode: value.trackingMode === 'time' ? 'time' : 'actions',
    completed: value.completed === true,
    createdAt: normalizeTimestamp(value.createdAt, nowIso),
    updatedAt: normalizeTimestamp(value.updatedAt, nowIso),
    milestones,
  };
}

function normalizeActivityEvent(value: unknown): ActivityEvent | null {
  if (!isRecord(value) || !asString(value.goalId) || !asString(value.goalTitle) || !asString(value.createdAt)) {
    return null;
  }

  const allowedTypes = ['goal_created', 'goal_updated', 'milestone_completed', 'milestone_reopened', 'goal_completed'];
  const type = asString(value.type);
  if (!type || !allowedTypes.includes(type)) {
    return null;
  }

  return {
    id: asString(value.id) ?? createId(),
    type: type as ActivityEvent['type'],
    goalId: value.goalId as string,
    goalTitle: value.goalTitle as string,
    milestoneTitle: asString(value.milestoneTitle) ?? undefined,
    createdAt: value.createdAt as string,
  };
}

function normalizeSettings(value: unknown): AppSettings {
  if (!isRecord(value)) {
    return {
      appName: DEFAULT_APP_NAME,
      calendarUrl: '',
    };
  }

  return {
    appName: asTrimmedString(value.appName) ?? DEFAULT_APP_NAME,
    calendarUrl: asString(value.calendarUrl)?.trim() ?? '',
  };
}

export function normalizeImportedAppData(value: unknown): AppData | null {
  if (!isRecord(value)) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const goals = Array.isArray(value.goals)
    ? value.goals.map((goal) => normalizeGoal(goal, nowIso)).filter((goal): goal is Goal => goal !== null)
    : [];

  const imported = {
    version: APP_SCHEMA_VERSION,
    createdAt: normalizeTimestamp(value.createdAt, nowIso),
    updatedAt: normalizeTimestamp(value.updatedAt, nowIso),
    primaryGoalId:
      typeof value.primaryGoalId === 'string' && goals.some((goal) => goal.id === value.primaryGoalId)
        ? value.primaryGoalId
        : goals[0]?.id ?? null,
    settings: normalizeSettings(value.settings),
    goals,
    activityLog: Array.isArray(value.activityLog)
      ? value.activityLog.map(normalizeActivityEvent).filter((event): event is ActivityEvent => event !== null)
      : [],
  };

  return imported;
}
