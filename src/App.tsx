import { useEffect, useState } from 'react';
import { CalendarPanel } from './components/CalendarPanel';
import { GoalCard } from './components/GoalCard';
import { GoalFormModal } from './components/GoalFormModal';
import { MissionHero } from './components/MissionHero';
import { SectionCard } from './components/SectionCard';
import { SettingsPanel } from './components/SettingsPanel';
import { UpcomingActions } from './components/UpcomingActions';
import { ReportsPanel } from './components/ReportsPanel';
import { AuthScreen } from './components/AuthScreen';
import { createBlankGoalDraft, createEmptyAppData, createDraftFromGoal, DEFAULT_APP_NAME } from './data/defaults';
import {
  createId,
  formatDateInputValue,
  getMissionSnapshot,
  getPrimaryGoal,
  getUpcomingActions,
  sortGoals,
} from './data/domain';
import { normalizeImportedAppData } from './data/importExport';
import { createSupabaseRepository } from './data/supabaseRepository';
import { supabase } from './data/supabase';
import { normalizeMilestoneDrafts } from './data/defaults';
import type { ActivityEvent, AppData, Goal, GoalDraft } from './data/types';
import type { User } from '@supabase/supabase-js';

type Notice = {
  type: 'success' | 'error' | 'info';
  message: string;
};

function buildGoalFromDraft(draft: GoalDraft, existingGoal: Goal | null): Goal {
  const nowIso = new Date().toISOString();
  const goalId = existingGoal?.id ?? draft.id ?? createId();

  return {
    id: goalId,
    title: draft.title.trim(),
    description: draft.description.trim(),
    deadline: draft.deadline,
    trackingMode: draft.trackingMode,
    completed: existingGoal?.completed ?? false,
    createdAt: existingGoal?.createdAt ?? nowIso,
    updatedAt: nowIso,
    milestones: normalizeMilestoneDrafts(draft.milestones),
  };
}

function updateGoalCompletion(goal: Goal, milestoneId: string, nextCompleted: boolean): Goal {
  const nowIso = new Date().toISOString();

  return {
    ...goal,
    updatedAt: nowIso,
    completed: goal.completed,
    milestones: goal.milestones.map((milestone) => {
      if (milestone.id !== milestoneId) {
        return milestone;
      }

      return {
        ...milestone,
        completed: nextCompleted,
        completedAt: nextCompleted ? milestone.completedAt ?? nowIso : null,
      };
    }),
  };
}

function createActivity(
  type: ActivityEvent['type'],
  goal: Goal,
  milestoneTitle?: string,
): ActivityEvent {
  return {
    id: createId(),
    type,
    goalId: goal.id,
    goalTitle: goal.title,
    milestoneTitle,
    createdAt: new Date().toISOString(),
  };
}

function completeGoal(goal: Goal): Goal {
  const nowIso = new Date().toISOString();

  return {
    ...goal,
    updatedAt: nowIso,
    completed: true,
    milestones: goal.milestones.map((milestone) =>
      milestone.completed
        ? milestone
        : {
            ...milestone,
            completed: true,
            completedAt: nowIso,
          },
    ),
  };
}

function createDownloadFile(data: AppData) {
  const payload = JSON.stringify(data, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `pizarra-${formatDateInputValue(new Date())}.json`;
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [data, setData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editorDraft, setEditorDraft] = useState<GoalDraft | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [blankDraft] = useState(() => createBlankGoalDraft());

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data: sessionData }) => {
      if (active) setUser(sessionData.session?.user ?? null);
    }).finally(() => {
      if (active) setIsAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!user) {
      setData(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    void createSupabaseRepository(user.id).load().then((stored) => {
      if (active) setData(stored ?? createEmptyAppData());
    }).catch(() => {
      if (active) setData(createEmptyAppData());
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (!data || isLoading || !user) return;
    void createSupabaseRepository(user.id).save(data).catch(() => {
      showNotice('error', 'No se pudo guardar la información en Supabase.');
    });
  }, [data, isLoading, user]);

  useEffect(() => {
    if (!data) {
      document.title = 'Pizarra';
      return;
    }

    const displayName = data.settings.appName.trim() || DEFAULT_APP_NAME;
    document.title = `${displayName} · Pizarra`;
  }, [data]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const showNotice = (type: Notice['type'], message: string) => {
    setNotice({ type, message });
  };

  const handleCreateGoal = () => {
    setEditorDraft(createBlankGoalDraft());
  };

  const handleEditGoal = (goalId: string) => {
    if (!data) {
      return;
    }

    const goal = data.goals.find((entry) => entry.id === goalId);
    if (!goal) {
      showNotice('error', 'No se encontró el objetivo que intentabas editar.');
      return;
    }

    setEditorDraft(createDraftFromGoal(goal));
  };

  const handleSaveGoal = (draft: GoalDraft) => {
    setData((current) => {
      if (!current) {
        return current;
      }

      const nowIso = new Date().toISOString();
      const existingGoal = draft.id ? current.goals.find((goal) => goal.id === draft.id) ?? null : null;
      const nextGoal = buildGoalFromDraft(draft, existingGoal);
      const goals = existingGoal
        ? current.goals.map((goal) => (goal.id === nextGoal.id ? nextGoal : goal))
        : [...current.goals, nextGoal];
      const primaryGoalId =
        current.primaryGoalId && goals.some((goal) => goal.id === current.primaryGoalId)
          ? current.primaryGoalId
          : nextGoal.id;
      const activity = createActivity(existingGoal ? 'goal_updated' : 'goal_created', nextGoal);

      return {
        ...current,
        updatedAt: nowIso,
        primaryGoalId,
        goals,
        activityLog: [activity, ...current.activityLog],
      };
    });

    setEditorDraft(null);
    showNotice('success', draft.id ? 'Objetivo actualizado.' : 'Objetivo creado.');
  };

  const handleDeleteGoal = (goalId: string) => {
    if (!data) {
      return;
    }

    const goal = data.goals.find((entry) => entry.id === goalId);
    if (!goal) {
      return;
    }

    const isPrimary = data.primaryGoalId === goalId;
    const confirmed = window.confirm(
      isPrimary
        ? 'Vas a eliminar tu misión principal. ¿Quieres continuar?'
        : `¿Eliminar "${goal.title}"? Esta acción no se puede deshacer.`,
    );

    if (!confirmed) {
      return;
    }

    setData((current) => {
      if (!current) {
        return current;
      }

      const remainingGoals = current.goals.filter((entry) => entry.id !== goalId);
      const nextPrimaryId =
        current.primaryGoalId === goalId
          ? remainingGoals[0]?.id ?? null
          : current.primaryGoalId && remainingGoals.some((entry) => entry.id === current.primaryGoalId)
            ? current.primaryGoalId
            : remainingGoals[0]?.id ?? null;

      return {
        ...current,
        goals: remainingGoals,
        primaryGoalId: nextPrimaryId,
        updatedAt: new Date().toISOString(),
      };
    });

    showNotice('success', 'Objetivo eliminado.');
  };

  const handleSetPrimaryGoal = (goalId: string) => {
    setData((current) => {
      if (!current || !current.goals.some((goal) => goal.id === goalId)) {
        return current;
      }

      return {
        ...current,
        primaryGoalId: goalId,
        updatedAt: new Date().toISOString(),
      };
    });

    showNotice('info', 'Ese objetivo ahora es tu misión principal.');
  };

  const handleCompleteGoal = (goalId: string) => {
    setData((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        updatedAt: new Date().toISOString(),
        goals: current.goals.map((goal) => (goal.id === goalId ? completeGoal(goal) : goal)),
      };
    });

    showNotice('success', 'Objetivo completado.');
  };

  const handleToggleMilestone = (goalId: string, milestoneId: string, nextCompleted: boolean) => {
    setData((current) => {
      if (!current) {
        return current;
      }

      const goal = current.goals.find((entry) => entry.id === goalId);
      const milestone = goal?.milestones.find((entry) => entry.id === milestoneId);
      const activity = goal && milestone
        ? createActivity(nextCompleted ? 'milestone_completed' : 'milestone_reopened', goal, milestone.title)
        : null;

      return {
        ...current,
        updatedAt: new Date().toISOString(),
        goals: current.goals.map((goal) =>
          goal.id === goalId ? updateGoalCompletion(goal, milestoneId, nextCompleted) : goal,
        ),
        activityLog: activity ? [activity, ...current.activityLog] : current.activityLog,
      };
    });
  };

  const handleUpdateAppName = (appName: string) => {
    setData((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        updatedAt: new Date().toISOString(),
        settings: {
          ...current.settings,
          appName,
        },
      };
    });
  };

  const handleUpdateCalendarUrl = (calendarUrl: string) => {
    setData((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        updatedAt: new Date().toISOString(),
        settings: {
          ...current.settings,
          calendarUrl: calendarUrl.trim(),
        },
      };
    });
  };

  const handleExport = () => {
    if (!data) {
      return;
    }

    createDownloadFile(data);
    showNotice('success', 'JSON exportado.');
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      const imported = normalizeImportedAppData(parsed);

      if (!imported) {
        showNotice('error', 'El archivo no tiene un formato compatible.');
        return;
      }

      setData(imported);
      setEditorDraft(null);
      showNotice('success', 'Datos importados correctamente.');
    } catch {
      showNotice('error', 'No se pudo leer el archivo JSON.');
    }
  };

  const handleReset = () => {
    const confirmed = window.confirm('Esto borrará tus datos de Pizarra en Supabase y volverá al estado inicial. ¿Continuar?');
    if (!confirmed) {
      return;
    }

    if (!user) return;
    void createSupabaseRepository(user.id).clear().then(() => {
      setData(createEmptyAppData());
    }).catch(() => showNotice('error', 'No se pudieron borrar los datos.'));
    setEditorDraft(null);
    showNotice('success', 'Datos restablecidos.');
  };

  const handleSignOut = () => {
    void supabase.auth.signOut();
  };

  if (isAuthLoading) {
    return <div className="app-shell"><div className="loading-state"><div className="loading-state__content"><h1>Conectando...</h1></div></div></div>;
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (isLoading || !data) {
    return (
      <div className="app-shell">
        <div className="loading-state" aria-busy="true" aria-live="polite">
          <div className="loading-state__badge" />
          <div className="loading-state__content">
            <p className="eyebrow">Pizarra</p>
            <h1>Cargando tu tablero...</h1>
            <p>Preparando tu misión, tus objetivos y tu calendario.</p>
          </div>
        </div>
      </div>
    );
  }

  const displayName = data.settings.appName.trim() || DEFAULT_APP_NAME;
  const primaryGoal = getPrimaryGoal(data);
  const missionSnapshot = primaryGoal ? getMissionSnapshot(primaryGoal) : null;
  const sortedGoals = sortGoals(data.goals, data.primaryGoalId);
  const upcomingActions = getUpcomingActions(data, 4);
  const calendarUrl = data.settings.calendarUrl.trim();

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="topbar__brand" href="#inicio" aria-label="Ir al inicio de Pizarra">
          <h1>{displayName}</h1>
        </a>

        <nav className="topbar__nav" aria-label="Navegación principal">
          <a href="#objetivos">Objetivos</a>
          <a href="#semana">Esta semana</a>
          <a href="#calendario">Calendario</a>
          <a href="#reportes">Reportes</a>
          <a href="#configuracion">Configuración</a>
        </nav>

        <div className="topbar__actions">
          <span className="account-email" title={user.email ?? undefined}>{user.email}</span>
          <button type="button" className="button button--primary" onClick={handleCreateGoal}>
            Crear objetivo
          </button>
          <button type="button" className="button button--ghost" onClick={handleSignOut}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {notice ? (
        <div className={`notice notice--${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
          {notice.message}
        </div>
      ) : null}

      <main className="dashboard">
        <div id="inicio">
        <MissionHero
          goal={primaryGoal}
          snapshot={missionSnapshot}
          onEdit={() => {
            if (primaryGoal) {
              handleEditGoal(primaryGoal.id);
            } else {
              handleCreateGoal();
            }
          }}
          onComplete={() => {
            if (primaryGoal) {
              handleCompleteGoal(primaryGoal.id);
            }
          }}
          />
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-column">
            <SectionCard
              id="objetivos"
              eyebrow="Objetivos"
              title="Tus metas activas"
              description="Cada objetivo mantiene sus hitos y su progreso. Sin listas infinitas ni ruido."
            >
              {sortedGoals.length > 0 ? (
                <div className="goals-list">
                  {sortedGoals.map((goal) => {
                    return (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        isPrimary={goal.id === data.primaryGoalId}
                        onEdit={() => handleEditGoal(goal.id)}
                        onDelete={() => handleDeleteGoal(goal.id)}
                        onComplete={() => handleCompleteGoal(goal.id)}
                        onSetPrimary={() => handleSetPrimaryGoal(goal.id)}
                        onToggleMilestone={(milestoneId, nextCompleted) =>
                          handleToggleMilestone(goal.id, milestoneId, nextCompleted)
                        }
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <p className="empty-state__title">Todavía no hay objetivos.</p>
                  <p className="empty-state__copy">
                    Empieza por una meta clara, añádele hitos y Pizarra empezará a mostrarte progreso real.
                  </p>
                </div>
              )}
            </SectionCard>

            <SectionCard
              id="semana"
              eyebrow="Esta semana"
              title="Acciones concretas"
              description="Solo los siguientes pasos que realmente empujan tu misión."
            >
              <UpcomingActions
                items={upcomingActions}
                onToggleMilestone={(goalId, milestoneId) => handleToggleMilestone(goalId, milestoneId, true)}
              />
            </SectionCard>
          </div>

          <aside className="dashboard-sidebar">
            <SectionCard
              id="calendario"
              eyebrow="Calendario"
              title="Google Calendar"
              description="Conecta un embed público para ver tus bloques de tiempo junto a tus objetivos."
            >
              <CalendarPanel calendarUrl={calendarUrl} />
            </SectionCard>

            <SectionCard
              id="configuracion"
              eyebrow="Configuración"
              title="Ajustes ligeros"
              description="Nombre, calendario, exportación, importación y restablecimiento."
            >
              <SettingsPanel
                appName={data.settings.appName}
                calendarUrl={data.settings.calendarUrl}
                onChangeAppName={handleUpdateAppName}
                onChangeCalendarUrl={handleUpdateCalendarUrl}
                onExport={handleExport}
                onImportFile={handleImportFile}
                onReset={handleReset}
              />
            </SectionCard>
          </aside>
        </div>

        <SectionCard
          id="reportes"
          eyebrow="Reportes"
          title="Cómo estás avanzando"
          description="Una lectura breve de tu progreso, tus cambios y los objetivos que se están quedando atrás."
        >
          <ReportsPanel data={data} />
        </SectionCard>
      </main>

      <GoalFormModal
        open={editorDraft !== null}
        initialDraft={editorDraft ?? blankDraft}
        onClose={() => setEditorDraft(null)}
        onSave={handleSaveGoal}
      />
    </div>
  );
}
