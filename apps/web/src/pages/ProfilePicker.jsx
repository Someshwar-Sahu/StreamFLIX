import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfiles, selectProfile } from "../api/profiles";
import { useAuth } from "../api/AuthContext";
import { getToken } from "../api/auth";
import ProfileModal from "../components/ProfileModal";
import { getValidAvatarUrl } from "../utils/avatar";
import StreamFlixLogo from "../components/StreamFlixLogo";
import styles from "../styles/ProfilePicker.module.css";

export default function ProfilePicker() {
    const [profiles, setProfiles] = useState([]);
    const [error, setError] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const navigate = useNavigate();
    const { selectProfile: setProfileToken, profileToken, role, logout } = useAuth();

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

    async function handlePick(profileId) {
        try {
            const token = await selectProfile(profileId);
            setProfileToken(token);
            navigate("/", { replace: true });
        } catch {
            setError("Couldn't switch to that profile. Try again.");
        }
    }

    const displayedProfiles = isAdminOrUploader ? profiles.slice(0, 1) : profiles;

    return (
        <div className={styles.stage}>
            <div style={{ position: 'absolute', top: 28, left: 32 }}>
                <StreamFlixLogo size={40} showText={true} />
            </div>
            <h1 className={styles.heading}>Who's Watching?</h1>
            <div className={styles.grid}>
                {displayedProfiles.map((p, i) => {
                    const avatarSrc = getValidAvatarUrl(p.avatar_url, p.id);
                    return (
                        <button
                            key={p.id}
                            className={styles.tile}
                            style={{ animationDelay: `${i * 60}ms` }}
                            onClick={() => handlePick(p.id)}
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
                        style={{ animationDelay: `${displayedProfiles.length * 60}ms` }}
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        <div className={styles.addRing}>+</div>
                        <span className={styles.name}>Add Profile</span>
                    </button>
                )}
            </div>
            {error && <p className={styles.error}>{error}</p>}

            <div style={{ marginTop: 32, textAlign: 'center' }}>
                <button
                    onClick={() => {
                        logout();
                        navigate("/login", { replace: true });
                    }}
                    style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#8A8F98',
                        padding: '10px 20px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s ease'
                    }}
                >
                    Sign Out & Reset Session
                </button>
            </div>

            <ProfileModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        </div>
    );
}