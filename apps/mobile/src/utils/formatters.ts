export const formatMbSize = (durationSeconds: number, quality: '1080p' | '720p' | '480p' | string): number => {
  const activeDuration = durationSeconds > 0 ? durationSeconds : 5400;
  if (quality === '1080p') return Math.max(25, Math.round(activeDuration * 0.625));
  if (quality === '720p') return Math.max(15, Math.round(activeDuration * 0.3125));
  return Math.max(8, Math.round(activeDuration * 0.125));
};

export const formatTimeSeconds = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}:${remMins < 10 ? '0' : ''}${remMins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};
