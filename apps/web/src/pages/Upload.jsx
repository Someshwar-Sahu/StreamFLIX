import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { uploadMovie, createSeries, createSeason, uploadEpisode } from "../api/upload";
import { getSeries, getSeriesDetail } from "../api/catalog";
import CategoryTagSelector from "../components/CategoryTagSelector";
import styles from "../styles/Upload.module.css";

export default function Upload() {
  const [tab, setTab] = useState("movie");
  const navigate = useNavigate();

  // movie state
  const [mTitle, setMTitle] = useState("");
  const [mDesc, setMDesc] = useState("");
  const [mCategoriesList, setMCategoriesList] = useState([]);
  const [mFile, setMFile] = useState(null);
  const [mPoster, setMPoster] = useState(null);

  // series state
  const [seriesMode, setSeriesMode] = useState("new"); // "new" or "existing"
  const [existingSeriesList, setExistingSeriesList] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [seasonsList, setSeasonsList] = useState([]);

  const [sTitle, setSTitle] = useState("");
  const [sDesc, setSDesc] = useState("");
  const [sCategoriesList, setSCategoriesList] = useState([]);
  const [sPoster, setSPoster] = useState(null);

  const [seriesId, setSeriesId] = useState(null);
  const [seasonNumber, setSeasonNumber] = useState(1);
  const [seasonId, setSeasonId] = useState(null);
  const [epNumber, setEpNumber] = useState(1);
  const [epTitle, setEpTitle] = useState("");
  const [epFile, setEpFile] = useState(null);

  const [uploadStats, setUploadStats] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (tab === "series") {
      getSeries()
        .then((list) => setExistingSeriesList(list || []))
        .catch(() => {});
    }
  }, [tab]);

  const handleSelectExistingSeries = async (sId) => {
    const sIdNum = Number(sId);
    setSeriesId(sIdNum);
    setSeasonId(null);
    if (!sIdNum) {
      setSelectedSeries(null);
      setSeasonsList([]);
      return;
    }
    try {
      const detail = await getSeriesDetail(sIdNum);
      setSelectedSeries(detail);
      setSeasonsList(detail.seasons || []);
      if (detail.seasons && detail.seasons.length > 0) {
        setSeasonId(detail.seasons[0].id);
        const nextEp = (detail.seasons[0].episodes?.length || 0) + 1;
        setEpNumber(nextEp);
        setSeasonNumber((detail.seasons.length) + 1);
      } else {
        setSeasonNumber(1);
      }
    } catch (err) {
      setError("Failed to load series details");
    }
  };

  const handleSelectSeason = (secId) => {
    const secIdNum = Number(secId);
    setSeasonId(secIdNum);
    const foundSeason = seasonsList.find((s) => s.id === secIdNum);
    if (foundSeason) {
      const nextEp = (foundSeason.episodes?.length || 0) + 1;
      setEpNumber(nextEp);
    }
  };

  async function handleMovieSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(""); setSuccess(""); setUploadStats(null);
    try {
      await uploadMovie({
        title: mTitle,
        description: mDesc,
        categoryNames: mCategoriesList.join(","),
        file: mFile,
        poster: mPoster,
        onProgress: (stats) => setUploadStats(stats),
      });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed");
      setUploadStats(null);
      setIsSubmitting(false);
    }
  }

  async function handleCreateSeries(e) {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(""); setSuccess("");
    try {
      const series = await createSeries({
        title: sTitle,
        description: sDesc,
        categoryNames: sCategoriesList.join(","),
        poster: sPoster,
      });
      setSeriesId(series.id);
      setSuccess(`Series created (#${series.id}). Now add a season.`);
    } catch (err) {
      setError(err.response?.data?.detail || "Series creation failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateSeason(e) {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(""); setSuccess("");
    try {
      const season = await createSeason(seriesId, seasonNumber);
      setSeasonId(season.id);
      setSuccess(`Season ${season.season_number} created. Now upload episodes.`);

      const detail = await getSeriesDetail(seriesId);
      setSeasonsList(detail.seasons || []);
      setEpNumber(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Season creation failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUploadEpisode(e) {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(""); setSuccess(""); setUploadStats(null);
    try {
      await uploadEpisode(seriesId, seasonId, {
        episodeNumber: epNumber,
        title: epTitle,
        file: epFile,
        onProgress: (stats) => setUploadStats(stats),
      });
      setSuccess(`Episode ${epNumber} uploaded and processing.`);
      setEpNumber((n) => n + 1);
      setEpTitle("");
      setEpFile(null);
      setUploadStats(null);

      const detail = await getSeriesDetail(seriesId);
      setSeasonsList(detail.seasons || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Episode upload failed");
      setUploadStats(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Upload Content</h1>

        {/* Content Type Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === "movie" ? styles.tabActive : ""}`} onClick={() => setTab("movie")}>Movie</button>
          <button className={`${styles.tab} ${tab === "series" ? styles.tabActive : ""}`} onClick={() => setTab("series")}>Series</button>
        </div>

        {uploadStats && (
          <div style={{ marginBottom: 20, padding: 16, background: 'rgba(242,169,59,0.1)', border: '1px solid #F2A93B', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#F2A93B', fontWeight: 700, fontSize: 14 }}>
              <span>Uploading Video... {uploadStats.percent}%</span>
              <span>{uploadStats.loadedMb} MB / {uploadStats.totalMb} MB</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#F2A93B', width: `${uploadStats.percent}%`, transition: 'width 0.2s ease' }} />
            </div>
          </div>
        )}

        {tab === "movie" && (
          <div className={styles.card}>
            <form onSubmit={handleMovieSubmit}>
              <label className={styles.label}>Title</label>
              <input className={styles.input} value={mTitle} onChange={(e) => setMTitle(e.target.value)} required />

              <label className={styles.label}>Description</label>
              <input className={styles.input} value={mDesc} onChange={(e) => setMDesc(e.target.value)} />

              <label className={styles.label}>Select Categories</label>
              <CategoryTagSelector selectedCategories={mCategoriesList} onChange={setMCategoriesList} />

              <label className={styles.label}>Video File</label>
              <input className={styles.fileInput} type="file" accept="video/*" onChange={(e) => setMFile(e.target.files[0])} required />

              <label className={styles.label}>Poster (optional)</label>
              <input className={styles.fileInput} type="file" accept="image/*" onChange={(e) => setMPoster(e.target.files[0])} />

              <button className={styles.submit} type="submit" disabled={isSubmitting || !!uploadStats}>
                {uploadStats ? `Uploading (${uploadStats.percent}%)...` : isSubmitting ? "Submitting..." : "Upload Movie"}
              </button>
            </form>
          </div>
        )}

        {tab === "series" && (
          <div className={styles.card}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <button
                className={`${styles.tab} ${seriesMode === "new" ? styles.tabActive : ""}`}
                onClick={() => { setSeriesMode("new"); setSeriesId(null); setSeasonId(null); }}
              >
                ➕ Create New Series
              </button>
              <button
                className={`${styles.tab} ${seriesMode === "existing" ? styles.tabActive : ""}`}
                onClick={() => { setSeriesMode("existing"); setSeriesId(null); setSeasonId(null); }}
              >
                📺 Select Existing Series
              </button>
            </div>

            {seriesMode === "new" && !seriesId && (
              <form onSubmit={handleCreateSeries}>
                <p className={styles.subHeading}>Step 1 — Create Series</p>
                <label className={styles.label}>Title</label>
                <input className={styles.input} value={sTitle} onChange={(e) => setSTitle(e.target.value)} required />

                <label className={styles.label}>Description</label>
                <input className={styles.input} value={sDesc} onChange={(e) => setSDesc(e.target.value)} />

                <label className={styles.label}>Select Categories</label>
                <CategoryTagSelector selectedCategories={sCategoriesList} onChange={setSCategoriesList} />

                <label className={styles.label}>Poster (optional)</label>
                <input className={styles.fileInput} type="file" accept="image/*" onChange={(e) => setSPoster(e.target.files[0])} />

                <button className={styles.submit} type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Series"}
                </button>
              </form>
            )}

            {seriesMode === "existing" && (
              <div style={{ marginBottom: 20 }}>
                <label className={styles.label}>Choose Existing Series</label>
                <select
                  className={styles.input}
                  onChange={(e) => handleSelectExistingSeries(e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>-- Select a Series --</option>
                  {existingSeriesList.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>

                {seriesId && (
                  <div style={{ marginTop: 16 }}>
                    <label className={styles.label}>Choose Season</label>
                    <select
                      className={styles.input}
                      value={seasonId || ""}
                      onChange={(e) => handleSelectSeason(e.target.value)}
                    >
                      {seasonsList.map((sec) => (
                        <option key={sec.id} value={sec.id}>Season {sec.season_number}</option>
                      ))}
                    </select>

                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#F2A93B', fontSize: 13, cursor: 'pointer', marginTop: 8, display: 'block' }}
                      onClick={() => setSeasonId(null)}
                    >
                      + Add a New Season
                    </button>
                  </div>
                )}
              </div>
            )}

            {seriesId && !seasonId && (
              <form onSubmit={handleCreateSeason} style={{ marginTop: 16, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                <p className={styles.subHeading}>Add Season {seasonNumber}</p>
                <label className={styles.label}>Season Number</label>
                <input className={styles.input} type="number" min="1" value={seasonNumber} onChange={(e) => setSeasonNumber(Number(e.target.value))} required />
                <button className={styles.submit} type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Season"}
                </button>
              </form>
            )}

            {seriesId && seasonId && (
              <form onSubmit={handleUploadEpisode} style={{ marginTop: 16 }}>
                <p className={styles.subHeading}>Upload Episode {epNumber}</p>
                <label className={styles.label}>Episode Title (optional)</label>
                <input className={styles.input} value={epTitle} onChange={(e) => setEpTitle(e.target.value)} placeholder={`e.g. Episode ${epNumber}`} />

                <label className={styles.label}>Video File</label>
                <input className={styles.fileInput} type="file" accept="video/*" onChange={(e) => setEpFile(e.target.files[0])} required />

                <button className={styles.submit} type="submit" disabled={isSubmitting || !!uploadStats}>
                  {uploadStats ? `Uploading (${uploadStats.percent}%)...` : isSubmitting ? "Submitting..." : "Upload Episode"}
                </button>
                <hr className={styles.divider} />
                <button type="button" className={styles.tab} onClick={() => navigate("/")}>Done — Go to Catalog</button>
              </form>
            )}

            {success && <p className={styles.success}>{success}</p>}
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}