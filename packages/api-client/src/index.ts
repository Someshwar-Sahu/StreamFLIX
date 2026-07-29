export function resolveMediaUrl(baseUrl: string, mediaPath: string | null | undefined): string | null {
  if (!mediaPath) return null;
  if (mediaPath.startsWith("http://") || mediaPath.startsWith("https://")) {
    return mediaPath;
  }
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = mediaPath.replace(/^\/+/, "");
  return `${cleanBase}/${cleanPath}`;
}
