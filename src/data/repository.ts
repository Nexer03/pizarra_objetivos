import { createDefaultAppData } from './defaults';
import { normalizeImportedAppData } from './importExport';
import type { AppData } from './types';

const STORAGE_KEY = 'pizarra.dashboard.v1';

export interface AppRepository {
  load(): Promise<AppData | null>;
  save(data: AppData): Promise<void>;
  clear(): Promise<void>;
}

function getStorage(): Storage | null {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export const localStorageRepository: AppRepository = {
  async load() {
    const storage = getStorage();
    if (!storage) {
      return null;
    }

    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      return normalizeImportedAppData(parsed);
    } catch {
      return null;
    }
  },
  async save(data) {
    const storage = getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  async clear() {
    const storage = getStorage();
    if (!storage) {
      return;
    }

    storage.removeItem(STORAGE_KEY);
  },
};

export async function loadAppDataOrDefault(): Promise<AppData> {
  return (await localStorageRepository.load()) ?? createDefaultAppData();
}
