import { useEffect, useState } from "react";
import { listUsers, updateUserRole, getStorageUsage } from "../api/admin";
import styles from "../styles/Admin.module.css";

const badgeClass = { admin: "badgeAdmin", uploader: "badgeUploader", viewer: "badgeViewer" };

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [storage, setStorage] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listUsers().then(setUsers).catch(() => setError("Couldn't load users."));
    getStorageUsage().then(setStorage).catch(() => {});
  }, []);

  async function handleRoleChange(userId, role) {
    try {
      const updated = await updateUserRole(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err) {
      setError(err.response?.data?.detail || "Role update failed");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Admin Panel</h1>

        {storage && (
          <>
            <h2 className={styles.sectionHeading}>Cloud Storage Pool Telemetry (Backblaze B2)</h2>
            {storage.b2_pool && (
              <div style={{ background: '#171B24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontWeight: 700 }}>
                  <span>Total Pool Storage</span>
                  <span style={{ color: storage.b2_pool.percent_used > 90 ? '#FF5252' : storage.b2_pool.percent_used > 70 ? '#F2A93B' : '#00C853' }}>
                    {storage.b2_pool.total_used_gb} GB / {storage.b2_pool.total_max_gb} GB ({storage.b2_pool.percent_used}%)
                  </span>
                </div>
                <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{ height: '100%', width: `${storage.b2_pool.percent_used}%`, background: storage.b2_pool.percent_used > 90 ? '#FF5252' : storage.b2_pool.percent_used > 70 ? '#F2A93B' : '#00C853', transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ fontSize: 13, color: '#8A8F98' }}>
                  Remaining Free Space: <strong style={{ color: '#00C853' }}>{storage.b2_pool.total_free_gb} GB</strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginTop: 16 }}>
                  {storage.b2_pool.buckets.map((b) => (
                    <div key={b.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                        <span>{b.name}</span>
                        {b.is_active_target && <span style={{ color: '#00C853', fontSize: 10 }}>[TARGET]</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#8A8F98', marginBottom: 8 }}>{b.used_gb} GB / {b.max_gb} GB</div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${b.percent_used}%`, background: b.percent_used > 90 ? '#FF5252' : '#00C853' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <h2 className={styles.sectionHeading}>Users</h2>
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
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td><span className={`${styles.badge} ${styles[badgeClass[u.role]] || ""}`}>{u.role}</span></td>
                <td>
                  <select className={styles.select} value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}>
                    <option value="viewer">viewer</option>
                    <option value="uploader">uploader</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {error && <p style={{ color: "#EF476F", marginTop: 16, fontSize: 13 }}>{error}</p>}
      </div>
    </div>
  );
}