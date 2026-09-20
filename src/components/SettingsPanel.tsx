import { useRef } from 'react';

type SettingsPanelProps = {
  appName: string;
  onChangeAppName: (value: string) => void;
  onExport: () => void;
  onImportFile: (file: File) => void;
  onReset: () => void;
};

export function SettingsPanel({
  appName,
  onChangeAppName,
  onExport,
  onImportFile,
  onReset,
}: SettingsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="settings-panel">
      <div className="field-grid">
        <label className="field">
          <span className="field__label">Nombre de la app</span>
          <input
            type="text"
            className="input"
            value={appName}
            onChange={(event) => onChangeAppName(event.currentTarget.value)}
            placeholder="Pizarra"
          />
        </label>

      </div>

      <p className="settings-panel__hint">Los cambios se guardan automáticamente en tu cuenta.</p>

      <div className="settings-panel__actions">
        <button type="button" className="button button--secondary" onClick={onExport}>
          Exportar JSON
        </button>
        <button type="button" className="button button--secondary" onClick={() => fileInputRef.current?.click()}>
          Importar JSON
        </button>
        <button type="button" className="button button--danger" onClick={onReset}>
          Restablecer
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) {
            onImportFile(file);
          }
          event.currentTarget.value = '';
        }}
      />
    </div>
  );
}
