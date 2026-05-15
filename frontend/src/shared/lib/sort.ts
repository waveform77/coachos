export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

export function sortBy<T>(items: T[], config: SortConfig<T>): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[config.key];
    const bVal = b[config.key];
    if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
    return 0;
  });
}
