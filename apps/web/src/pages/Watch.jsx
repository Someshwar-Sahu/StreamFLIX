import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { API_BASE_URL } from "../api/client";
import { useAuth } from "../api/AuthContext";
import { getContentDetails, toggleWatchlist, rateContent, clearRating } from "../api/interactions";
import CustomWebPlayer from "../components/CustomWebPlayer";
import AnimatedModal from "../components/AnimatedModal";
import { useToast } from "../context/ToastContext";

export default function Watch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { showToast } = useToast();
  const [details, setDetails] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const lastSyncedTimeRef = useRef(0);

  useEffect(() => {
    getContentDetails(id).then(setDetails).catch(() => {});
  }, [id]);

  const handleProgressReport = (currentTime, duration, forceSync = false) => {
    if (forceSync || (currentTime > 3 && Math.abs(currentTime - lastSyncedTimeRef.current) >= 15)) {
      lastSyncedTimeRef.current = currentTime;

      api.post('/watch-history', {
        content_id: Number(id),
        progress_seconds: Math.floor(currentTime),
        duration_seconds: duration ? Math.floor(duration) : null,
      }).catch(() => {});
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (lastSyncedTimeRef.current > 0) {
        const payload = JSON.stringify({
          content_id: Number(id),
          progress_seconds: Math.floor(lastSyncedTimeRef.current),
        });
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(`${API_BASE_URL}/watch-history`, blob);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [id]);

  async function handleWatchlist() {
    if (!details) return;
    const willBeInWatchlist = !details.in_watchlist;
    setDetails((d) => ({ ...d, in_watchlist: willBeInWatchlist }));
    await toggleWatchlist(Number(id), details.in_watchlist);
    showToast(willBeInWatchlist ? "Saved to your Watchlist!" : "Removed from your Watchlist.", "info");
  }

  async function handleRate(value) {
    if (!details) return;
    const oldRating = details.my_rating;

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

      return { ...prev, my_rating: newRating, likes: newLikes, dislikes: newDislikes };
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
    showToast(`Movie deleted successfully.`, "info");
    navigate('/movies');
  };

  const movieData = details?.content || details;
  const videoSrc = `${API_BASE_URL}/content/${id}/video`;
  const videoTitle = movieData?.title || 'StreamFlix Premiere';

  return (
    <div className="page-container">
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <CustomWebPlayer
          src={videoSrc}
          title={videoTitle}
          initialTime={details?.resume_progress_seconds}
          contentDuration={movieData?.duration || details?.duration_seconds}
          onBackPress={() => navigate(-1)}
          onProgressReport={handleProgressReport}
        />

        {movieData && (
          <div style={{ marginTop: 32, padding: '0 8px' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', color: '#ffffff', fontSize: '2.2rem', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>
              {movieData.title}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: 24, maxWidth: 800 }}>
              {movieData.description || 'Enjoy watching on StreamFlix in HD with zero buffering.'}
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={handleWatchlist}
                style={{
                  padding: '10px 22px',
                  borderRadius: '24px',
                  border: details.in_watchlist ? '1px solid var(--primary-red)' : '1px solid rgba(255,255,255,0.15)',
                  background: details.in_watchlist ? 'var(--primary-red)' : 'var(--bg-surface-low)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: details.in_watchlist ? '0 0 16px var(--primary-glow)' : 'none',
                  transition: 'all 0.25s ease',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {details.in_watchlist ? 'check' : 'add'}
                </span>
                {details.in_watchlist ? 'Saved in Watchlist' : 'Add to Watchlist'}
              </button>

              <button
                onClick={() => handleRate(1)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '24px',
                  border: details.my_rating === 1 ? '1px solid var(--primary-red)' : '1px solid rgba(255,255,255,0.15)',
                  background: details.my_rating === 1 ? 'rgba(229, 9, 20, 0.2)' : 'var(--bg-surface-low)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.25s ease',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: details.my_rating === 1 ? "'FILL' 1" : "'FILL' 0" }}>
                  thumb_up
                </span>
                {details.likes || 0}
              </button>

              <button
                onClick={() => handleRate(-1)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '24px',
                  border: details.my_rating === -1 ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.15)',
                  background: 'var(--bg-surface-low)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.25s ease',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: details.my_rating === -1 ? "'FILL' 1" : "'FILL' 0" }}>
                  thumb_down
                </span>
                {details.dislikes || 0}
              </button>

              {(role === 'uploader' || role === 'admin') && (
                <button
                  onClick={() => setIsDeleteOpen(true)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '24px',
                    border: '1px solid rgba(229, 9, 20, 0.4)',
                    background: 'rgba(229, 9, 20, 0.15)',
                    color: '#ffb4aa',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: 14,
                    marginLeft: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.25s ease',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                  Delete Movie
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatedModal
        isOpen={isDeleteOpen}
        title="Delete Movie"
        message={`Are you sure you want to delete "${details?.title || 'this movie'}"? This action cannot be undone.`}
        type="danger"
        confirmText="Delete Movie"
        onConfirm={handleDeleteContent}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}