import React, { useEffect, useState } from "react";
import { listUsers, updateUserRole, getStorageUsage } from "../api/admin";
import { useToast } from "../context/ToastContext";
import styles from "../styles/Admin.module.css";

const badgeClass = { admin: "badgeAdmin", uploader: "badgeUploader", viewer: "badgeViewer" };

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [storage, setStorage] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    listUsers().then(setUsers).catch(() => showToast("Couldn't load users.", "error"));
    getStorageUsage().then(setStorage).catch(() => {});
  }, [showToast]);

  async function handleRoleChange(userId, role, username) {
    try {
      const updated = await updateUserRole(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      showToast(`Updated role for ${username} to "${role}".`, "success");
    } catch (err) {
      showToast(err.response?.data?.detail || "Role update failed", "error");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Administrative Console</h1>
        <p className={styles.subText}>System telemetry, storage cluster monitor, and user access control.</p>

        {storage && storage.b2_pool && (
          <div style={{ background: "var(--bg-surface-low)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, marginBottom: 36 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="material-symbols-outlined" style={{ color: "var(--primary-red)" }}>cloud_done</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#ffffff" }}>
                  Storage Cluster Pool (Backblaze B2 & Cloudflare CDN)
                </span>
              </div>
              <span style={{ fontWeight: 800, color: "#ffffff", fontSize: 14 }}>
                {storage.b2_pool.total_used_gb} GB / {storage.b2_pool.total_max_gb} GB ({storage.b2_pool.percent_used}%)
              </span>
            </div>

            <div style={{ height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
              <div
                style={{
                  height: "100%",
                  width: `${storage.b2_pool.percent_used}%`,
                  background: storage.b2_pool.percent_used > 90 ? "#ff5252" : storage.b2_pool.percent_used > 70 ? "#f2a93b" : "var(--primary-red)",
                  boxShadow: "0 0 10px var(--primary-glow)",
                  transition: "width 0.4s ease",
                }}
              />
            </div>

            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
              Remaining Available Storage: <strong style={{ color: "var(--match-green)" }}>{storage.b2_pool.total_free_gb} GB</strong>
            </div>

            {/* Individual Bucket Container Breakdown */}
            {storage.b2_pool.buckets && storage.b2_pool.buckets.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                {storage.b2_pool.buckets.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: b.is_active_target ? "1px solid rgba(229, 9, 20, 0.4)" : "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 10,
                      padding: "14px 16px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#ffffff" }}>{b.name}</span>
                      {b.is_active_target && (
                        <span style={{ color: "var(--primary-red)", fontSize: 10, fontWeight: 800, letterSpacing: "0.05em", background: "rgba(229, 9, 20, 0.15)", padding: "2px 6px", borderRadius: 4 }}>
                          ACTIVE TARGET
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>
                      {b.used_gb} GB / {b.max_gb} GB ({b.percent_used}%)
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${b.percent_used}%`,
                          background: b.percent_used > 90 ? "#ff5252" : b.is_active_target ? "var(--primary-red)" : "var(--match-green)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <h2 className={styles.sectionHeading}>Registered User Accounts</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Change Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td style={{ fontWeight: 700 }}>{u.username}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[badgeClass[u.role]] || ""}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <select
                      className={styles.select}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value, u.username)}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="uploader">Uploader</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}