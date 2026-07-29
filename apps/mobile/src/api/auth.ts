import AsyncStorage from "@react-native-async-storage/async-storage";
import {decode as atob} from "base-64";
import api from "./client";

const TOKEN_KEY = "auth_token";
const PROFILE_TOKEN_KEY = "profile_token";

export async function saveProfileToken(token: string): Promise<void> {
  await AsyncStorage.setItem(PROFILE_TOKEN_KEY, token);
}

export async function getProfileToken(): Promise<string | null> {
  return await AsyncStorage.getItem(PROFILE_TOKEN_KEY);
}

export async function getProfileId(): Promise<number | null> {
  const token = await getProfileToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.profile_id || null;
  } catch {
    return null;
  }
}

export async function clearProfileToken(): Promise<void> {
  await AsyncStorage.removeItem(PROFILE_TOKEN_KEY);
}

export async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

export async function getRole(): Promise<string | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(PROFILE_TOKEN_KEY);
}

export async function login(email: string, password: string): Promise<string> {
  const res = await api.post<{ access_token: string }>("/auth/login", { email, password });
  return res.data.access_token;
}

export async function register(email: string, username: string, password: string): Promise<string> {
  const res = await api.post<{ access_token: string }>("/auth/register", { email, username, password });
  return res.data.access_token;
}
