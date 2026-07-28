import api from "./client";

export async function uploadMovie({ title, description, categoryNames, file, poster }) {
  const fd = new FormData();
  fd.append("title", title);
  if (description) fd.append("description", description);
  if (categoryNames) fd.append("category_names", categoryNames);
  fd.append("file", file);
  if (poster) fd.append("poster", poster);
  return api.post("/content", fd, { headers: { "Content-Type": "multipart/form-data" } });
}

export async function createSeries({ title, description, categoryNames, poster }) {
  const fd = new FormData();
  fd.append("title", title);
  if (description) fd.append("description", description);
  if (categoryNames) fd.append("category_names", categoryNames);
  if (poster) fd.append("poster", poster);
  const res = await api.post("/series", fd, { headers: { "Content-Type": "multipart/form-data" } });
  return res.data;
}

export async function createSeason(seriesId, seasonNumber) {
  const fd = new FormData();
  fd.append("season_number", seasonNumber);
  const res = await api.post(`/series/${seriesId}/seasons`, fd, { headers: { "Content-Type": "multipart/form-data" } });
  return res.data;
}

export async function uploadEpisode(seriesId, seasonId, { episodeNumber, title, file }) {
  const fd = new FormData();
  fd.append("episode_number", episodeNumber);
  if (title) fd.append("title", title);
  fd.append("file", file);
  return api.post(`/series/${seriesId}/seasons/${seasonId}/episodes`, fd, { headers: { "Content-Type": "multipart/form-data" } });
}