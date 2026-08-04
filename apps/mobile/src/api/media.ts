import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

let activeBaseUrl = API_BASE_URL;

AsyncStorage.getItem('custom_host_ip').then((customIp) => {
  if (customIp) activeBaseUrl = customIp;
});

export function setMediaBaseUrl(url: string) {
  activeBaseUrl = url;
}

export function resolveMediaUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${activeBaseUrl}${path}`;
}