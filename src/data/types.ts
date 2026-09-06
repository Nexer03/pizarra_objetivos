export const APP_SCHEMA_VERSION = 1 as const;

export type GoalStatus = 'pending' | 'in_progress' | 'completed';

export type MissionState = 'active' | 'urgent' | 'overdue' | 'completed';

export type AppSettings = {
  appName: string;
  calendarUrl: string;
};

export type Milestone = {
  id: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
};

export type Goal = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  milestones: Milestone[];
};

export type AppData = {
  version: typeof APP_SCHEMA_VERSION;
  createdAt: string;
  updatedAt: string;
  primaryGoalId: string | null;
  settings: AppSettings;
  goals: Goal[];
};

export type GoalDraftMilestone = {
  id: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
};

export type GoalDraft = {
  id: string | null;
  title: string;
  description: string;
  deadline: string;
  milestones: GoalDraftMilestone[];
};

export type UpcomingAction = {
  goalId: string;
  milestoneId: string;
  goalTitle: string;
  milestoneTitle: string;
  goalDeadline: string;
  isPrimary: boolean;
};

export type GoalMetrics = {
  status: GoalStatus;
  completedMilestones: number;
  totalMilestones: number;
  progressPercent: number;
};

export type MissionSnapshot = GoalMetrics & {
  daysRemaining: number;
  timeProgressPercent: number;
  elapsedDays: number;
  totalDays: number;
  state: MissionState;
};
