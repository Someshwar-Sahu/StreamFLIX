import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadMovie, createSeries, createSeason, uploadEpisode } from "../api/upload";
import { getSeries, getSeriesDetail } from "../api/catalog";
import CategoryTagSelector from "../components/CategoryTagSelector";
import { useToast } from "../context/ToastContext";
import styles from "../styles/Upload.module.css";

export default function Upload() {
  const [tab, setTab] = useState("movie");
  const navigate = useNavigate();
  const cancelUploadRef = useRef(null);
  const { showToast } = useToast();

  const [mTitle, setMTitle] = useState("");
  const [mDesc, setMDesc] = useState("");
  const [mCategoriesList, setMCategoriesList] = useState([]);
  const [mFile, setMFile] = useState(null);
  const [mPoster, setMPoster] = useState(null);

  const [seriesMode, setSeriesMode] = useState("new");
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

  useEffect(() => {
    const isUploading = isSubmitting || uploadStats !== null;
    window.isUploadActive = isUploading;
    window.dispatchEvent(new CustomEvent("streamflix:upload-state", { detail: { isUploading } }));

    function handleBeforeUnload(e) {
      if (isUploading) {
        e.preventDefault();
        e.returnValue = "An upload is in progress. Leaving will cancel your upload.";
        return e.returnValue;
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.isUploadActive = false;
      window.dispatchEvent(new CustomEvent("streamflix:upload-state", { detail: { isUploading: false } }));
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isSubmitting, uploadStats]);

  useEffect(() => {
    if (tab === "series") {
      getSeries().then((list) => setExistingSeriesList(list || [])).catch(() => {});
    }
  }, [tab]);

  useEffect(() => {
    if (selectedSeries) {
      getSeriesDetail(selectedSeries.id).then((detail) => {
        setSeasonsList(detail.seasons || []);
        if (detail.seasons && detail.seasons.length > 0) {
          setSeasonId(detail.seasons[0].id);
        }
      }).catch(() => {});
    }
  }, [selectedSeries]);

  const handleCancelUpload = () => {
    if (cancelUploadRef.current) {
      cancelUploadRef.current("Upload cancelled by user");
      cancelUploadRef.current = null;
    }
    setUploadStats(null);
    setIsSubmitting(false);
    showToast("Upload process was cancelled.", "info");
  };

  async function handleMovieSubmit(e) {
    e.preventDefault();
    if (!mFile) {
      showToast("Please select a video file to upload", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await uploadMovie({
        title: mTitle,
        description: mDesc,
        categories: mCategoriesList,
        file: mFile,
        posterFile: mPoster,
        onProgress: (stats) => setUploadStats(stats),
        cancelRef: cancelUploadRef,
      });

      showToast(`Movie "${mTitle}" uploaded successfully!`, "success");
      setMTitle("");
      setMDesc("");
      setMCategoriesList([]);
      setMFile(null);
      setMPoster(null);
      setUploadStats(null);
      navigate("/movies");
    } catch (err) {
      if (err.message !== "Upload cancelled by user") {
        showToast(err.response?.data?.detail || err.message || "Failed to upload movie", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateSeries(e) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await createSeries({
        title: sTitle,
        description: sDesc,
        categories: sCategoriesList,
        posterFile: sPoster,
      });
      setSeriesId(created.id);
      setSelectedSeries(created);
      showToast(`Series "${sTitle}" created! Now add Season 1 and your first episode.`, "success");
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to create series", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateSeason(e) {
    e.preventDefault();
    const targetSeriesId = seriesId || selectedSeries?.id;
    if (!targetSeriesId) {
      showToast("Please select or create a series first", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const createdSeason = await createSeason(targetSeriesId, seasonNumber);
      setSeasonId(createdSeason.id);
      showToast(`Season ${seasonNumber} created successfully!`, "success");
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to create season", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUploadEpisode(e) {
    e.preventDefault();
    const targetSeriesId = seriesId || selectedSeries?.id;
    if (!targetSeriesId || !seasonId || !epFile) {
      showToast("Please select a series, season, and video file", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await uploadEpisode({
        seriesId: targetSeriesId,
        seasonId: seasonId,
        episodeNumber: epNumber,
        title: epTitle,
        file: epFile,
        onProgress: (stats) => setUploadStats(stats),
        cancelRef: cancelUploadRef,
      });

      showToast(`Episode ${epNumber} uploaded successfully!`, "success");
      setEpTitle("");
      setEpNumber((prev) => prev + 1);
      setEpFile(null);
      setUploadStats(null);
      navigate(`/series/${targetSeriesId}`);
    } catch (err) {
      if (err.message !== "Upload cancelled by user") {
        showToast(err.response?.data?.detail || err.message || "Failed to upload episode", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Creator Studio</h1>
        <p className={styles.subText}>Upload and publish feature films, series, and multi-season content.</p>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "movie" ? styles.tabActive : ""}`}
            onClick={() => setTab("movie")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>movie</span>
            Feature Movie
          </button>
          <button
            className={`${styles.tab} ${tab === "series" ? styles.tabActive : ""}`}
            onClick={() => setTab("series")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>tv</span>
            TV Series
          </button>
        </div>

        {tab === "movie" && (
          <div className={styles.card}>
            <form onSubmit={handleMovieSubmit}>
              <label className={styles.label}>Movie Title</label>
              <input
                className={styles.input}
                placeholder="e.g. Interstellar: The Final Frontier"
                value={mTitle}
                onChange={(e) => setMTitle(e.target.value)}
                required
              />

              <label className={styles.label}>Synopsis / Description</label>
              <textarea
                className={styles.input}
                style={{ height: 100, padding: 14, resize: "vertical" }}
                placeholder="Brief movie synopsis..."
                value={mDesc}
                onChange={(e) => setMDesc(e.target.value)}
              />

              <label className={styles.label}>Categories & Genres</label>
              <CategoryTagSelector
                selectedCategories={mCategoriesList}
                onChange={setMCategoriesList}
              />

              <label className={styles.label}>Video File (MP4, MKV, WebM)</label>
              <input
                className={styles.fileInput}
                type="file"
                accept="video/*"
                onChange={(e) => setMFile(e.target.files[0])}
                required
              />

              <label className={styles.label}>Custom Poster Image (JPEG, PNG, WebP)</label>
              <input
                className={styles.fileInput}
                type="file"
                accept="image/*"
                onChange={(e) => setMPoster(e.target.files[0])}
              />

              {uploadStats && (
                <div className={styles.progressBox}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#ffffff", fontWeight: 700 }}>
                    <span>Uploading Video File...</span>
                    <span>{uploadStats.progressPct}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${uploadStats.progressPct}%` }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
                    <span>Speed: {uploadStats.speedMbps} Mbps</span>
                    <span>ETA: {uploadStats.etaSec}s remaining</span>
                  </div>
                  <button type="button" onClick={handleCancelUpload} className={styles.cancelBtn}>
                    Cancel Upload
                  </button>
                </div>
              )}

              <button className={styles.submit} type="submit" disabled={isSubmitting}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>cloud_upload</span>
                {isSubmitting ? "Uploading Video File..." : "Publish Movie to Catalog"}
              </button>
            </form>
          </div>
        )}

        {tab === "series" && (
          <div className={styles.card}>
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              <button
                type="button"
                className={`${styles.tab} ${seriesMode === "new" ? styles.tabActive : ""}`}
                onClick={() => setSeriesMode("new")}
              >
                1. Create New Series
              </button>
              <button
                type="button"
                className={`${styles.tab} ${seriesMode === "existing" ? styles.tabActive : ""}`}
                onClick={() => setSeriesMode("existing")}
              >
                2. Add Episode to Existing Series
              </button>
            </div>

            {seriesMode === "new" && !seriesId && (
              <form onSubmit={handleCreateSeries}>
                <label className={styles.label}>Series Title</label>
                <input
                  className={styles.input}
                  placeholder="e.g. Stranger Signals"
                  value={sTitle}
                  onChange={(e) => setSTitle(e.target.value)}
                  required
                />

                <label className={styles.label}>Series Synopsis</label>
                <textarea
                  className={styles.input}
                  style={{ height: 90, padding: 14, resize: "vertical" }}
                  placeholder="Overview of the series..."
                  value={sDesc}
                  onChange={(e) => setSDesc(e.target.value)}
                />

                <label className={styles.label}>Categories & Genres</label>
                <CategoryTagSelector
                  selectedCategories={sCategoriesList}
                  onChange={setSCategoriesList}
                />

                <label className={styles.label}>Series Cover Poster</label>
                <input
                  className={styles.fileInput}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSPoster(e.target.files[0])}
                />

                <button className={styles.submit} type="submit" disabled={isSubmitting}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_circle</span>
                  Create Series & Proceed to Episodes
                </button>
              </form>
            )}

            {(seriesMode === "existing" || seriesId) && (
              <div>
                {seriesMode === "existing" && !seriesId && (
                  <div style={{ marginBottom: 20 }}>
                    <label className={styles.label}>Select Target Series</label>
                    <select
                      className={styles.input}
                      value={selectedSeries?.id || ""}
                      onChange={(e) => {
                        const s = existingSeriesList.find((item) => item.id === Number(e.target.value));
                        setSelectedSeries(s || null);
                      }}
                      required
                    >
                      <option value="">-- Choose Series --</option>
                      {existingSeriesList.map((s) => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Season selection / creation */}
                <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 12, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span className={styles.subHeading}>Season Setup</span>
                  </div>

                  <div className={styles.row}>
                    <div>
                      <label className={styles.label}>Season Number</label>
                      <input
                        className={styles.input}
                        type="number"
                        min="1"
                        value={seasonNumber}
                        onChange={(e) => setSeasonNumber(Number(e.target.value))}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                      <button
                        type="button"
                        onClick={handleCreateSeason}
                        className={styles.submit}
                        style={{ height: 48, marginTop: 0 }}
                        disabled={isSubmitting || !(seriesId || selectedSeries?.id)}
                      >
                        Create Season {seasonNumber}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Episode Upload Form */}
                <form onSubmit={handleUploadEpisode}>
                  <h3 className={styles.subHeading} style={{ marginTop: 24 }}>Upload Episode Video</h3>

                  <div className={styles.row}>
                    <div>
                      <label className={styles.label}>Episode Number</label>
                      <input
                        className={styles.input}
                        type="number"
                        min="1"
                        value={epNumber}
                        onChange={(e) => setEpNumber(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div>
                      <label className={styles.label}>Episode Title</label>
                      <input
                        className={styles.input}
                        placeholder="e.g. Chapter 1: The Vanishing"
                        value={epTitle}
                        onChange={(e) => setEpTitle(e.target.value)}
                      />
                    </div>
                  </div>

                  <label className={styles.label}>Episode Video File (MP4, MKV, WebM)</label>
                  <input
                    className={styles.fileInput}
                    type="file"
                    accept="video/*"
                    onChange={(e) => setEpFile(e.target.files[0])}
                    required
                  />

                  {uploadStats && (
                    <div className={styles.progressBox}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#ffffff", fontWeight: 700 }}>
                        <span>Uploading Episode Video...</span>
                        <span>{uploadStats.progressPct}%</span>
                      </div>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${uploadStats.progressPct}%` }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
                        <span>Speed: {uploadStats.speedMbps} Mbps</span>
                        <span>ETA: {uploadStats.etaSec}s remaining</span>
                      </div>
                      <button type="button" onClick={handleCancelUpload} className={styles.cancelBtn}>
                        Cancel Upload
                      </button>
                    </div>
                  )}

                  <button className={styles.submit} type="submit" disabled={isSubmitting || !seasonId || !epFile}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>cloud_upload</span>
                    {isSubmitting ? "Uploading Episode..." : "Publish Episode"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}