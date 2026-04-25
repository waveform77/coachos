export function formatMatchDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isMatchLive(date: string | Date): boolean {
  const now = new Date();
  const matchDate = new Date(date);
  const diff = now.getTime() - matchDate.getTime();
  return diff >= 0 && diff <= 120 * 60 * 1000;
}
