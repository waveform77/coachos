const PREFIX = 'fm_';

export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(PREFIX + key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: <T>(key: string, value: T) => {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  },
  remove: (key: string) => {
    localStorage.removeItem(PREFIX + key);
  },
};
