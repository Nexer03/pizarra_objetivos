import { addDays, createId, formatDateInputValue } from './domain';
import type { AppData, Goal, GoalDraft, GoalDraftMilestone, Milestone } from './types';
import { APP_SCHEMA_VERSION } from './types';

export const DEFAULT_APP_NAME = 'Pizarra';
export const PRIMARY_MISSION_DEADLINE = '2026-12-14';

export function createEmptyAppData(now = new Date()): AppData {
  const timestamp = now.toISOString();

  return {
    version: APP_SCHEMA_VERSION,
    createdAt: timestamp,
    updatedAt: timestamp,
    primaryGoalId: null,
    settings: {
      appName: DEFAULT_APP_NAME,
      calendarUrl: '',
    },
    goals: [],
    activityLog: [],
  };
}

export function createBlankGoalDraft(now = new Date()): GoalDraft {
  return {
    id: null,
    title: '',
    description: '',
    deadline: formatDateInputValue(addDays(now, 30)),
    trackingMode: 'actions',
    milestones: [
      {
        id: createId(),
        title: '',
        completed: false,
        completedAt: null,
      },
    ],
  };
}

export function createDraftFromGoal(goal: Goal): GoalDraft {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    deadline: goal.deadline,
    trackingMode: goal.trackingMode,
    milestones:
      goal.milestones.length > 0
        ? goal.milestones.map((milestone) => ({
            id: milestone.id,
            title: milestone.title,
            completed: milestone.completed,
            completedAt: milestone.completedAt,
          }))
        : [
            {
              id: createId(),
              title: '',
              completed: false,
              completedAt: null,
            },
          ],
  };
}

export function normalizeMilestoneDrafts(milestones: GoalDraftMilestone[]): Milestone[] {
  return milestones
    .map((milestone) => ({
      id: milestone.id || createId(),
      title: milestone.title.trim(),
      completed: milestone.completed,
      completedAt: milestone.completed ? milestone.completedAt ?? new Date().toISOString() : null,
    }))
    .filter((milestone) => milestone.title.length > 0);
}
