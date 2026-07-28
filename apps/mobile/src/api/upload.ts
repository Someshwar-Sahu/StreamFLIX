import api from './client';

type FilePart = { uri: string; type?: string; name?: string };

export async function uploadMovie({ title, description, categoryNames, file, poster }: { title: string; description?: string; categoryNames?: string; file: FilePart; poster?: FilePart | null }) {
  const fd = new FormData();
  fd.append('title', title);
  if (description) fd.append('description', description);
  if (categoryNames) fd.append('category_names', categoryNames);
  fd.append('file', { uri: file.uri, type: file.type || 'video/mp4', name: file.name || 'upload.mp4' } as any);
  if (poster) fd.append('poster', { uri: poster.uri, type: poster.type || 'image/jpeg', name: poster.name || 'poster.jpg' } as any);
  return api.post('/content', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
}

export async function createSeries({ title, description, categoryNames, poster }: { title: string; description?: string; categoryNames?: string; poster?: FilePart | null }) {
  const fd = new FormData();
  fd.append('title', title);
  if (description) fd.append('description', description);
  if (categoryNames) fd.append('category_names', categoryNames);
  if (poster) fd.append('poster', { uri: poster.uri, type: poster.type || 'image/jpeg', name: poster.name || 'poster.jpg' } as any);
  const res = await api.post('/series', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
}

export async function createSeason(seriesId: number, seasonNumber: number) {
  const fd = new FormData();
  fd.append('season_number', String(seasonNumber));
  const res = await api.post(`/series/${seriesId}/seasons`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
}

export async function uploadEpisode(seriesId: number, seasonId: number, { episodeNumber, title, file }: { episodeNumber: number; title?: string; file: FilePart }) {
  const fd = new FormData();
  fd.append('episode_number', String(episodeNumber));
  if (title) fd.append('title', title);
  fd.append('file', { uri: file.uri, type: file.type || 'video/mp4', name: file.name || 'upload.mp4' } as any);
  return api.post(`/series/${seriesId}/seasons/${seasonId}/episodes`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
}