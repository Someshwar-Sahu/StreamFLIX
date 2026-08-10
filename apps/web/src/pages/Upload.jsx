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

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Creator Studio</h1>
        <p className={styles.subText}>Upload and publish feature films, series, and high-definition media.</p>

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
                    <span>Uploading Video...</span>
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
      </div>
    </div>
  );
}