import api from "./client";

export async function getProfiles() {
  const res = await api.get("/profiles");
  return res.data;
}

export async function selectProfile(profileId) {
  const res = await api.post(`/profiles/${profileId}/select`);
  return res.data.access_token;
}