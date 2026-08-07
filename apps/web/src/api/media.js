import { API_BASE_URL } from "./client";

export function resolveMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("blob:") || path.startsWith("/avatars")) {
    return path;
  }
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}