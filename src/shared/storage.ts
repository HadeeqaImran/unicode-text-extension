import { DEFAULT_PREFERENCES } from "./types";
import type { UserPreferences } from "./types";

const STORAGE_KEY = "preferences";

export async function getPreferences(): Promise<UserPreferences> {
  const stored = await chrome.storage.sync.get(STORAGE_KEY);
  return { ...DEFAULT_PREFERENCES, ...(stored[STORAGE_KEY] as Partial<UserPreferences> | undefined) };
}

export async function savePreferences(preferences: UserPreferences): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEY]: preferences });
}

export async function patchPreferences(patch: Partial<UserPreferences>): Promise<UserPreferences> {
  const nextPreferences = { ...(await getPreferences()), ...patch };
  await savePreferences(nextPreferences);
  return nextPreferences;
}

export async function ensurePreferences(): Promise<UserPreferences> {
  const preferences = await getPreferences();
  await savePreferences(preferences);
  return preferences;
}
