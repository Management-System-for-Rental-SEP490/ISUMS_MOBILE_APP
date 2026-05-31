import {
  preferencesSelectors,
  usePreferencesStore,
} from "../../store/usePreferencesStore";

export function useIotPreferences() {
  return usePreferencesStore(preferencesSelectors.iot);
}

export function useNotificationPreferences() {
  return usePreferencesStore(preferencesSelectors.notifications);
}

export function useDisplayPreferences() {
  return usePreferencesStore(preferencesSelectors.display);
}

export function useBillsPreferences() {
  return usePreferencesStore(preferencesSelectors.bills);
}

export function usePrivacyPreferences() {
  return usePreferencesStore(preferencesSelectors.privacy);
}

export function usePreferencesHydrated() {
  return usePreferencesStore(preferencesSelectors.hydrated);
}
