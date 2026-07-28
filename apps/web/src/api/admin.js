import api from "./client";

export async function listUsers() {
  const res = await api.get("/admin/users");
  return res.data;
}

export async function updateUserRole(userId, role) {
  const res = await api.patch(`/admin/users/${userId}/role`, { role });
  return res.data;
}

export async function getStorageUsage() {
  const res = await api.get("/admin/storage");
  return res.data;
}