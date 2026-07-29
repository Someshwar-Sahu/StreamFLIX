export function getValidAvatarUrl(avatarUrl, profileId = 1) {
  if (avatarUrl && (avatarUrl.startsWith("/avatars") || avatarUrl.startsWith("http"))) {
    return avatarUrl;
  }
  if (avatarUrl && avatarUrl.startsWith("avatar-")) {
    const file = avatarUrl.endsWith(".svg") ? avatarUrl : `${avatarUrl}.svg`;
    return `/avatars/${file}`;
  }
  const defaultIdx = (Math.abs(Number(profileId) || 1) % 8) + 1;
  return `/avatars/avatar-${defaultIdx}.svg`;
}
