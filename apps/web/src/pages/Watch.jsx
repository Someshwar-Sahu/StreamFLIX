import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Hls from "hls.js";
import api from "../api/client";
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
    const src = `http://localhost:8000/media/${id}/master.m3u8`;
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

  const handleProgressReport = (currentTime, duration) => {
    if (currentTime > 3) {
      api.post('/watch-history', {
        content_id: Number(id),
        progress_seconds: Math.floor(currentTime),
        duration_seconds: duration ? Math.floor(duration) : null,
      }).catch(() => {});
    }
  };

  async function handleWatchlist() {
    await toggleWatchlist(Number(id), details.in_watchlist);
    setDetails((d) => ({ ...d, in_watchlist: !d.in_watchlist }));
  }

  async function handleRate(value) {
    if (details.my_rating === value) {
      await clearRating(Number(id));
      setDetails((d) => ({ ...d, my_rating: null }));
    } else {
      await rateContent(Number(id), value);
      setDetails((d) => ({ ...d, my_rating: value }));
    }
  }

  const handleDeleteContent = async () => {
    await api.delete(`/content/${id}`);
    navigate('/movies');
  };

  const videoSrc = `http://localhost:8000/media/${id}/master.m3u8`;
  const videoTitle = details?.title || `Watching Title #${id}`;

  return (
    <div className="page-container padded">
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <CustomWebPlayer
          src={videoSrc}
          title={videoTitle}
          levels={levels}
          currentLevel={currentLevel}
          onSelectLevel={handleSelectLevel}
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
                  background: details.my_rating === 1 ? 'rgba(242,169,59,0.15)' : 'rgba(23,27,36,0.8)',
                  color: '#F5F5F0',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                👍 {details.likes}
              </button>
              <button
                onClick={() => handleRate(-1)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '20px',
                  border: details.my_rating === -1 ? '1px solid #F2A93B' : '1px solid rgba(255,255,255,0.15)',
                  background: details.my_rating === -1 ? 'rgba(242,169,59,0.15)' : 'rgba(23,27,36,0.8)',
                  color: '#F5F5F0',
                  cursor: 'pointer',
                  fontWeight: '600',
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