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
            <h2 className={styles.sectionHeading}>Storage</h2>
            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{storage.total_mb} MB</div>
                <div className={styles.statLabel}>Total Storage</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{storage.transcoded_content_mb} MB</div>
                <div className={styles.statLabel}>Transcoded Content</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{storage.raw_leftover_mb} MB</div>
                <div className={styles.statLabel}>Raw Leftover</div>
              </div>
            </div>
            {storage.raw_leftover_mb > 0 && <p className={styles.note}>{storage.raw_leftover_note}</p>}
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