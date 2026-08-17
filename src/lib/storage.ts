const STORAGE_KEY = 'pantry-tracker:state:v2';

export function loadState<T>(): T | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveState<T>(state: T): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private mode, quota exceeded, etc.) — fail silently
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

const ONBOARDING_KEY = 'pantry-tracker:onboarding-dismissed:v1';

export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === '1';
  } catch {
    return true;
  }
}

export function markOnboardingSeen(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, '1');
  } catch {
    // ignore
  }
}
