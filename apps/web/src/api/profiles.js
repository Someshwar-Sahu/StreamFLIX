import api from "./client";

export async function getProfiles() {
    const res = await api.get("/profiles");
    return res.data;
}

export async function selectProfile(profileId) {
    const res = await api.post(`/profiles/${profileId}/select`);
    return res.data.access_token;
}

export async function createProfile(payload) {
    const res = await api.post("/profiles", payload);
    return res.data;
}

export async function updateProfile(profileId, payload) {
    const res = await api.patch(`/profiles/${profileId}`, payload);
    return res.data;
}

export async function deleteProfile(profileId) {
    const res = await api.delete(`/profiles/${profileId}`);
    return res.data;
}