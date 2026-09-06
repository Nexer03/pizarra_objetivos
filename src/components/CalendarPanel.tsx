type CalendarPanelProps = {
  calendarUrl: string;
};

export function CalendarPanel({ calendarUrl }: CalendarPanelProps) {
  return (
    <div className="calendar-shell">
      {calendarUrl ? (
        <div className="calendar-frame">
          <iframe
            title="Google Calendar"
            src={calendarUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="calendar-placeholder">
          <p className="calendar-placeholder__title">Calendario no configurado</p>
          <p className="calendar-placeholder__copy">
            Pega una URL pública o de embed de Google Calendar en Configuración para ver tu agenda aquí.
          </p>
        </div>
      )}
    </div>
  );
}
