import { useState } from 'react';
import { addDays, formatDateInputValue, parseLocalDate } from '../data/domain';
import type { CalendarMilestone } from '../data/types';

type CalendarPanelProps = {
  items: CalendarMilestone[];
  onToggleMilestone: (goalId: string, milestoneId: string, nextCompleted: boolean) => void;
};

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function startOfCalendarGrid(month: Date): Date {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  return addDays(firstDay, -((firstDay.getDay() + 6) % 7));
}

function formatMonth(month: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric',
  }).format(month);
}

function formatSelectedDate(value: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(parseLocalDate(value));
}

export function CalendarPanel({ items, onToggleMilestone }: CalendarPanelProps) {
  const today = new Date();
  const todayKey = formatDateInputValue(today);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const gridStart = startOfCalendarGrid(visibleMonth);
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  const selectedItems = items.filter((item) => item.scheduledDate === selectedDate);

  const selectDay = (day: Date) => {
    setSelectedDate(formatDateInputValue(day));
    if (day.getMonth() !== visibleMonth.getMonth() || day.getFullYear() !== visibleMonth.getFullYear()) {
      setVisibleMonth(new Date(day.getFullYear(), day.getMonth(), 1));
    }
  };

  const moveMonth = (amount: number) => {
    const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + amount, 1);
    setVisibleMonth(nextMonth);
    setSelectedDate(formatDateInputValue(nextMonth));
  };

  const goToToday = () => {
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(todayKey);
  };

  return (
    <div className="calendar-shell">
      <div className="calendar-toolbar">
        <div className="calendar-toolbar__navigation">
          <button type="button" className="calendar-nav-button" onClick={() => moveMonth(-1)} aria-label="Mes anterior">
            ‹
          </button>
          <button type="button" className="calendar-nav-button" onClick={() => moveMonth(1)} aria-label="Mes siguiente">
            ›
          </button>
        </div>
        <h3>{formatMonth(visibleMonth)}</h3>
        <button type="button" className="calendar-today-button" onClick={goToToday}>Hoy</button>
      </div>

      <div className="calendar-weekdays" aria-hidden="true">
        {WEEKDAYS.map((weekday) => <span key={weekday}>{weekday}</span>)}
      </div>

      <div className="calendar-grid" aria-label={`Calendario de ${formatMonth(visibleMonth)}`}>
        {days.map((day) => {
          const dateKey = formatDateInputValue(day);
          const dayItems = items.filter((item) => item.scheduledDate === dateKey);
          const isOutside = day.getMonth() !== visibleMonth.getMonth();
          const isSelected = dateKey === selectedDate;
          const isToday = dateKey === todayKey;

          return (
            <button
              type="button"
              key={dateKey}
              className={`calendar-day${isOutside ? ' calendar-day--outside' : ''}${isSelected ? ' calendar-day--selected' : ''}${isToday ? ' calendar-day--today' : ''}`}
              onClick={() => selectDay(day)}
              aria-pressed={isSelected}
              aria-label={`${formatSelectedDate(dateKey)}, ${dayItems.length} hitos`}
            >
              <span className="calendar-day__number">{day.getDate()}</span>
              {dayItems.length > 0 ? (
                <span className="calendar-day__dots" aria-hidden="true">
                  {dayItems.slice(0, 3).map((item) => (
                    <span key={item.milestoneId} className={item.completed ? 'is-completed' : undefined} />
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="calendar-agenda">
        <div className="calendar-agenda__header">
          <span>Hitos del día</span>
          <strong>{formatSelectedDate(selectedDate)}</strong>
        </div>

        {selectedItems.length > 0 ? (
          <ul className="calendar-agenda__items">
            {selectedItems.map((item) => (
              <li key={`${item.goalId}-${item.milestoneId}`}>
                <label className="calendar-agenda__item">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={(event) => onToggleMilestone(item.goalId, item.milestoneId, event.currentTarget.checked)}
                  />
                  <span>
                    <strong className={item.completed ? 'is-completed' : undefined}>{item.milestoneTitle}</strong>
                    <small>{item.goalTitle}{item.isPrimary ? ' · misión principal' : ''}</small>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="calendar-agenda__empty">No hay hitos programados para este día.</p>
        )}
      </div>
    </div>
  );
}
