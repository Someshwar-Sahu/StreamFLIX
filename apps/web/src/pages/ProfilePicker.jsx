import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfiles, selectProfile } from "../api/profiles";
import { useAuth } from "../api/AuthContext";
import { getToken } from "../api/auth";
import ProfileModal from "../components/ProfileModal";
import { getValidAvatarUrl } from "../utils/avatar";
import StreamFlixLogo from "../components/StreamFlixLogo";
import { useToast } from "../context/ToastContext";
import styles from "../styles/ProfilePicker.module.css";

export default function ProfilePicker() {
  const [profiles, setProfiles] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();
  const { selectProfile: setProfileToken, profileToken, role, logout } = useAuth();
  const { showToast } = useToast();

  const isAdminOrUploader = role === "admin" || role === "uploader";

  useEffect(() => {
    if (!getToken()) {
      navigate("/login", { replace: true });
      return;
    }
    if (profileToken) {
      navigate("/", { replace: true });
      return;
    }
    getProfiles()
      .then((list) => {
        if (!list || list.length === 0) {
          logout();
          navigate("/login", { replace: true });
        } else {
          setProfiles(list);
        }
      })
      .catch(() => {
        logout();
        navigate("/login", { replace: true });
      });
  }, [navigate, profileToken, logout]);

  async function handlePick(profileId, profileName) {
    try {
      const token = await selectProfile(profileId);
      setProfileToken(token);
      showToast(`Welcome back, ${profileName}!`, "success");
      navigate("/", { replace: true });
    } catch {
      showToast("Couldn't switch to that profile. Please try again.", "error");
    }
  }

  const displayedProfiles = isAdminOrUploader ? profiles.slice(0, 1) : profiles;

  return (
    <div className={styles.stage}>
      <div className={styles.logoWrap}>
        <StreamFlixLogo size={38} showText={true} />
      </div>

      <h1 className={styles.heading}>Who's Watching?</h1>

      <div className={styles.grid}>
        {displayedProfiles.map((p) => {
          const avatarSrc = getValidAvatarUrl(p.avatar_url, p.id);
          return (
            <button
              key={p.id}
              className={styles.tile}
              onClick={() => handlePick(p.id, p.name)}
            >
              <div className={styles.ring}>
                <img
                  src={avatarSrc}
                  alt={p.name}
                  className={styles.avatarImg}
                  onError={(e) => {
                    e.currentTarget.src = getValidAvatarUrl(null, p.id);
                  }}
                />
              </div>
              <span className={styles.name}>{p.name}</span>
            </button>
          );
        })}

        {!isAdminOrUploader && (
          <button
            className={styles.tile}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <div className={styles.addRing}>+</div>
            <span className={styles.name}>Add Profile</span>
          </button>
        )}
      </div>

      <div style={{ marginTop: 48, textAlign: "center" }}>
        <button
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "var(--text-secondary)",
            padding: "10px 24px",
            borderRadius: 20,
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            fontWeight: 600,
            transition: "all 0.25s ease",
          }}
        >
          Manage Profiles / Sign Out
        </button>
      </div>

      <ProfileModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  );
}