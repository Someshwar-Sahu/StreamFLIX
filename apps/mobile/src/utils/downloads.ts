import AsyncStorage from '@react-native-async-storage/async-storage';

export type DownloadQuality = '1080p' | '720p' | '480p';

export type DownloadedItem = {
  id: string;
  contentId: number | string;
  title: string;
  type: 'movie' | 'episode';
  posterUrl: string | null;
  sizeMb: number;
  duration: string;
  resolution: string;
  downloadedAt: string;
};

const STORAGE_KEY = '@streamflix_offline_downloads_v2';

let globalDownloadsStore: DownloadedItem[] = [];
let listeners: Array<(items: DownloadedItem[]) => void> = [];

export async function loadPersistedDownloads() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      globalDownloadsStore = JSON.parse(raw);
      listeners.forEach((fn) => fn(globalDownloadsStore));
    }
  } catch (err) {
    console.error(err);
  }
}

loadPersistedDownloads();

export async function savePersistedDownloads() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(globalDownloadsStore));
  } catch (err) {
    console.error(err);
  }
}

export function subscribeDownloads(callback: (items: DownloadedItem[]) => void) {
  listeners.push(callback);
  callback(globalDownloadsStore);
  return () => {
    listeners = listeners.filter((fn) => fn !== callback);
  };
}

export function getDownloadsStore(): DownloadedItem[] {
  return globalDownloadsStore;
}

export function isContentDownloaded(contentId: number | string): boolean {
  return globalDownloadsStore.some((item) => String(item.contentId) === String(contentId));
}

export async function saveDownload(data: {
  id: number | string;
  title: string;
  poster_url?: string | null;
  duration?: number;
  quality?: DownloadQuality;
  sizeMb?: number;
}) {
  const quality = data.quality || '1080p';
  const labelMap: Record<DownloadQuality, string> = {
    '1080p': '1080p Full HD',
    '720p': '720p HD',
    '480p': '480p Data Saver',
  };

  const formattedDur = data.duration
    ? `${Math.floor(data.duration / 60)}m ${Math.floor(data.duration % 60)}s`
    : 'HD Video';

  const newItem: DownloadedItem = {
    id: `${data.id}_${Date.now()}`,
    contentId: data.id,
    title: data.title,
    type: 'movie',
    posterUrl: data.poster_url || null,
    sizeMb: data.sizeMb || 250,
    duration: formattedDur,
    resolution: labelMap[quality] || '1080p Full HD',
    downloadedAt: new Date().toISOString(),
  };

  globalDownloadsStore = [newItem, ...globalDownloadsStore.filter((i) => String(i.contentId) !== String(data.id))];
  await savePersistedDownloads();
  listeners.forEach((fn) => fn(globalDownloadsStore));
}

export async function removeDownload(contentId: number | string) {
  globalDownloadsStore = globalDownloadsStore.filter((i) => String(i.contentId) !== String(contentId));
  await savePersistedDownloads();
  listeners.forEach((fn) => fn(globalDownloadsStore));
}
