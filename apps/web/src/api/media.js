const API_BASE_URL = "http://localhost:8000";

export function resolveMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("/avatars")) return path;
  return `${API_BASE_URL}${path}`;
}