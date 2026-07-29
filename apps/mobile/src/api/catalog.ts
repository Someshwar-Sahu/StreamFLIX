import api from './client';

export async function getContent(params: { q?: string; category?: string } = {}) {
  const res = await api.get('/content', { params });
  return res.data;
}

export async function getSeries() {
  const res = await api.get('/series');
  return res.data;
}

export async function getSeriesDetail(id: number | string) {
  const res = await api.get(`/series/${id}`);
  return res.data;
}

export async function getTrending() {
  const res = await api.get('/content/trending');
  return res.data;
}

export async function getCategories() {
  const res = await api.get('/categories');
  return res.data;
}