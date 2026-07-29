import api from "./client";

export interface Profile {
  id: number;
  account_id: number;
  name: string;
  avatar_url?: string | null;
  created_at: string;
}

export async function getProfiles(): Promise<Profile[]> {
  const res = await api.get<Profile[]>("/profiles");
  return res.data;
}

export async function selectProfile(profileId: number): Promise<string> {
  const res = await api.post<{ access_token: string }>(`/profiles/${profileId}/select`);
  return res.data.access_token;
}

export async function createProfile(payload: { name: string; avatar_url?: string }): Promise<Profile> {
  const res = await api.post<Profile>("/profiles", payload);
  return res.data;
}

export async function deleteProfile(profileId: number): Promise<{ status: string }> {
  const res = await api.delete<{ status: string }>(`/profiles/${profileId}`);
  return res.data;
}
