import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfiles, selectProfile } from "../api/profiles";
import { useAuth } from "../api/AuthContext";
import { getToken } from "../api/auth";
import styles from "../styles/ProfilePicker.module.css";

export default function ProfilePicker() {
    const [profiles, setProfiles] = useState([]);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { selectProfile: setProfileToken, profileToken } = useAuth();

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
            .then(setProfiles)
            .catch(() => setError("Couldn't load profiles. Try logging in again."));
    }, [navigate, profileToken]);

    async function handlePick(profileId) {
        try {
            const token = await selectProfile(profileId);
            setProfileToken(token);
            navigate("/", { replace: true });
        } catch {
            setError("Couldn't switch to that profile. Try again.");
        }
    }

    return (
        <div className={styles.stage}>
            <div className={styles.logo}>StramFlix</div>
            <h1 className={styles.heading}>Who's Watching?</h1>
            <div className={styles.grid}>
                {profiles.map((p, i) => (
                    <button
                        key={p.id}
                        className={styles.tile}
                        style={{ animationDelay: `${i * 60}ms` }}
                        onClick={() => handlePick(p.id)}
                    >
                        <div className={styles.ring}>
                            <img
                                src={p.avatar_url || "/avatars/avatar-1.svg"}
                                alt={p.name}
                                className={styles.avatarImg}
                            />
                        </div>
                        <span className={styles.name}>{p.name}</span>
                    </button>
                ))}
                <button
                    className={styles.tile}
                    style={{ animationDelay: `${profiles.length * 60}ms` }}
                    onClick={() => navigate("/profiles/new")}
                >
                    <div className={styles.addRing}>+</div>
                    <span className={styles.name}>Add Profile</span>
                </button>
            </div>
            {error && <p className={styles.error}>{error}</p>}
        </div>
    )
}