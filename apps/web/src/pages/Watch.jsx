import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Hls from "hls.js";
import api, { API_BASE_URL } from "../api/client";
import { useAuth } from "../api/AuthContext";
import { getContentDetails, toggleWatchlist, rateContent, clearRating } from "../api/interactions";
import CustomWebPlayer from "../components/CustomWebPlayer";
import DeleteSafetyModal from "../components/DeleteSafetyModal";

export default function Watch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const hlsRef = useRef(null);
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [details, setDetails] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    const src = `${API_BASE_URL}/content/${id}/stream/master.m3u8`;
    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => setLevels(data.levels));
      return () => hls.destroy();
    }
  }, [id]);

  useEffect(() => {
    getContentDetails(id).then(setDetails).catch(() => {});
  }, [id]);

  const handleSelectLevel = (levelIdx) => {
    setCurrentLevel(levelIdx);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIdx;
    }
  };

  const lastSyncedTimeRef = useRef(0)

  const handleProgressReport = (currentTime, duration, forceSync = false) => {
    if (forceSync || (currentTime > 3 && (Math.abs(currentTime - lastSyncedTimeRef.current) >= 15))) {
      lastSyncedTimeRef.current = currentTime

      api.post('/watch-history', {
        content_id: Number(id),
        progress_seconds: Math.floor(currentTime),
        duration_seconds: duration ? Math.floor(duration) : null
      }).catch(() => {})
    }
  }

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (lastSyncedTimeRef.current > 0) {
        const payload = JSON.stringify({
          content_id: Number(id),
          progress_seconds: Math.floor(lastSyncedTimeRef.current),
        })
        const blob = new Blob([payload], { type: 'application/json' })
        navigator.sendBeacon(`${API_BASE_URL}/watch-history`, blob)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    } 
  }, [id])

  async function handleWatchlist() {
    if (!details) return;
    setDetails((d) => ({ ...d, in_watchlist: !d.in_watchlist }));
    await toggleWatchlist(Number(id), details.in_watchlist);
  }

  async function handleRate(value) {
    if (!details) return;
    const oldRating = details.my_rating;

    // Instant Optimistic State Update
    setDetails((prev) => {
      let newLikes = prev.likes || 0;
      let newDislikes = prev.dislikes || 0;
      let newRating = value;

      if (oldRating === value) {
        newRating = null;
        if (value === 1) newLikes = Math.max(0, newLikes - 1);
        if (value === -1) newDislikes = Math.max(0, newDislikes - 1);
      } else {
        if (value === 1) {
          newLikes += 1;
          if (oldRating === -1) newDislikes = Math.max(0, newDislikes - 1);
        } else if (value === -1) {
          newDislikes += 1;
          if (oldRating === 1) newLikes = Math.max(0, newLikes - 1);
        }
      }

      return {
        ...prev,
        my_rating: newRating,
        likes: newLikes,
        dislikes: newDislikes,
      };
    });

    try {
      if (oldRating === value) {
        await clearRating(Number(id));
      } else {
        await rateContent(Number(id), value);
      }
      const fresh = await getContentDetails(id);
      setDetails(fresh);
    } catch (err) {
      console.error(err);
    }
  }

  const handleDeleteContent = async () => {
    await api.delete(`/content/${id}`);
    navigate('/movies');
  };

  const videoSrc = `${API_BASE_URL}/content/${id}/stream/master.m3u8`;
  const videoTitle = details?.title || `Watching Title #${id}`;

  return (
    <div className="page-container padded">
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <CustomWebPlayer
          src={videoSrc}
          title={videoTitle}
          initialTime={details?.resume_progress_seconds}
          contentDuration={details?.content?.duration}
          onBackPress={() => navigate(-1)}
          onProgressReport={handleProgressReport}
        />

        {details && (
          <div style={{ marginTop: 24 }}>
            <h1 style={{ color: '#F5F5F0', fontSize: '2rem', marginBottom: 12 }}>{details.title}</h1>
            <p style={{ color: '#8A8F98', fontSize: '1rem', lineHeight: 1.6, marginBottom: 20 }}>
              {details.description || 'Enjoy watching on StreamFlix in HD.'}
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={handleWatchlist}
                style={{
                  padding: '10px 18px',
                  borderRadius: '20px',
                  border: details.in_watchlist ? '1px solid #F2A93B' : '1px solid rgba(255,255,255,0.15)',
                  background: details.in_watchlist ? 'rgba(242,169,59,0.15)' : 'rgba(23,27,36,0.8)',
                  color: details.in_watchlist ? '#F2A93B' : '#F5F5F0',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                }}
              >
                {details.in_watchlist ? '✓ Saved in Watchlist' : '+ Add to Watchlist'}
              </button>
              <button
                onClick={() => handleRate(1)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '20px',
                  border: details.my_rating === 1 ? '1px solid #F2A93B' : '1px solid rgba(255,255,255,0.15)',
                  background: details.my_rating === 1 ? 'rgba(242,169,59,0.2)' : 'rgba(23,27,36,0.8)',
                  color: details.my_rating === 1 ? '#F2A93B' : '#F5F5F0',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                }}
              >
                👍 {details.likes}
              </button>
              <button
                onClick={() => handleRate(-1)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '20px',
                  border: details.my_rating === -1 ? '1px solid #EF476F' : '1px solid rgba(255,255,255,0.15)',
                  background: details.my_rating === -1 ? 'rgba(239,71,111,0.2)' : 'rgba(23,27,36,0.8)',
                  color: details.my_rating === -1 ? '#EF476F' : '#F5F5F0',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                }}
              >
                👎 {details.dislikes}
              </button>

              {(role === 'uploader' || role === 'admin') && (
                <button
                  onClick={() => setIsDeleteOpen(true)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '20px',
                    border: '1px solid rgba(239, 71, 111, 0.4)',
                    background: 'rgba(239, 71, 111, 0.15)',
                    color: '#EF476F',
                    cursor: 'pointer',
                    fontWeight: '600',
                    marginLeft: 'auto',
                  }}
                >
                  🗑️ Delete Movie
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <DeleteSafetyModal
        isOpen={isDeleteOpen}
        title={details?.title || 'this movie'}
        onConfirm={handleDeleteContent}
        onClose={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}