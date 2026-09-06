import { createEmptyAppData } from './defaults';
import { normalizeImportedAppData } from './importExport';
import { supabase } from './supabase';
import type { AppData } from './types';

type StoredData = {
  data: unknown;
};

export interface AppRepository {
  load(): Promise<AppData | null>;
  save(data: AppData): Promise<void>;
  clear(): Promise<void>;
}

export function createSupabaseRepository(userId: string): AppRepository {
  return {
    async load() {
      const { data, error } = await supabase
        .from('pizarra_data')
        .select('data')
        .eq('user_id', userId)
        .maybeSingle<StoredData>();

      if (error) throw error;
      return data ? normalizeImportedAppData(data.data) : null;
    },
    async save(appData) {
      const { error } = await supabase.from('pizarra_data').upsert({
        user_id: userId,
        data: appData,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
    },
    async clear() {
      const { error } = await supabase.from('pizarra_data').delete().eq('user_id', userId);
      if (error) throw error;
    },
  };
}

export async function loadUserAppData(userId: string): Promise<AppData> {
  return (await createSupabaseRepository(userId).load()) ?? createEmptyAppData();
}
