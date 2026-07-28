import api from './client';

export async function getContentDetails(id: number) {
  const res = await api.get(`/content/${id}/details`);
  return res.data;
}

export async function toggleWatchlist(contentId: number, inWatchlist: boolean) {
  if (inWatchlist) return api.delete(`/watchlist/content/${contentId}`);
  return api.post('/watchlist', { content_id: contentId });
}

export async function rateContent(contentId: number, value: number) {
  return api.post('/ratings', { content_id: contentId, value });
}

export async function clearRating(contentId: number) {
  return api.delete(`/ratings/content/${contentId}`);
}

export async function getSeriesDetails(id: number) {
  const res = await api.get(`/series/${id}/details`);
  return res.data;
}

export async function toggleSeriesWatchlist(seriesId: number, inWatchlist: boolean) {
  if (inWatchlist) return api.delete(`/watchlist/series/${seriesId}`);
  return api.post('/watchlist', { series_id: seriesId });
}

export async function rateSeries(seriesId: number, value: number) {
  return api.post('/ratings', { series_id: seriesId, value });
}

export async function clearSeriesRating(seriesId: number) {
  return api.delete(`/ratings/series/${seriesId}`);
}