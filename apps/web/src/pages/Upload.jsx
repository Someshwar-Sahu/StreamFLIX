import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadMovie, createSeries, createSeason, uploadEpisode } from "../api/upload";
import styles from "../styles/Upload.module.css";

export default function Upload() {
  const [tab, setTab] = useState("movie");
  const navigate = useNavigate();

  // movie state
  const [mTitle, setMTitle] = useState("");
  const [mDesc, setMDesc] = useState("");
  const [mCategories, setMCategories] = useState("");
  const [mFile, setMFile] = useState(null);
  const [mPoster, setMPoster] = useState(null);

  // series state
  const [sTitle, setSTitle] = useState("");
  const [sDesc, setSDesc] = useState("");
  const [sCategories, setSCategories] = useState("");
  const [sPoster, setSPoster] = useState(null);
  const [seriesId, setSeriesId] = useState(null);
  const [seasonNumber, setSeasonNumber] = useState(1);
  const [seasonId, setSeasonId] = useState(null);
  const [epNumber, setEpNumber] = useState(1);
  const [epTitle, setEpTitle] = useState("");
  const [epFile, setEpFile] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleMovieSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      await uploadMovie({ title: mTitle, description: mDesc, categoryNames: mCategories, file: mFile, poster: mPoster });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed");
    }
  }

  async function handleCreateSeries(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      const series = await createSeries({ title: sTitle, description: sDesc, categoryNames: sCategories, poster: sPoster });
      setSeriesId(series.id);
      setSuccess(`Series created (#${series.id}). Now add a season.`);
    } catch (err) {
      setError(err.response?.data?.detail || "Series creation failed");
    }
  }

  async function handleCreateSeason(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      const season = await createSeason(seriesId, seasonNumber);
      setSeasonId(season.id);
      setSuccess(`Season ${season.season_number} created. Now upload episodes.`);
    } catch (err) {
      setError(err.response?.data?.detail || "Season creation failed");
    }
  }

  async function handleUploadEpisode(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      await uploadEpisode(seriesId, seasonId, { episodeNumber: epNumber, title: epTitle, file: epFile });
      setSuccess(`Episode ${epNumber} uploaded and processing.`);
      setEpNumber((n) => n + 1);
      setEpTitle("");
      setEpFile(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Episode upload failed");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Upload</h1>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === "movie" ? styles.tabActive : ""}`} onClick={() => setTab("movie")}>Movie</button>
          <button className={`${styles.tab} ${tab === "series" ? styles.tabActive : ""}`} onClick={() => setTab("series")}>Series</button>
        </div>

        {tab === "movie" && (
          <div className={styles.card}>
            <form onSubmit={handleMovieSubmit}>
              <label className={styles.label}>Title</label>
              <input className={styles.input} value={mTitle} onChange={(e) => setMTitle(e.target.value)} required />

              <label className={styles.label}>Description</label>
              <input className={styles.input} value={mDesc} onChange={(e) => setMDesc(e.target.value)} />

              <label className={styles.label}>Categories (comma-separated)</label>
              <input className={styles.input} value={mCategories} onChange={(e) => setMCategories(e.target.value)} placeholder="Action, Drama" />

              <label className={styles.label}>Video File</label>
              <input className={styles.fileInput} type="file" accept="video/*" onChange={(e) => setMFile(e.target.files[0])} required />

              <label className={styles.label}>Poster (optional)</label>
              <input className={styles.fileInput} type="file" accept="image/*" onChange={(e) => setMPoster(e.target.files[0])} />

              <button className={styles.submit} type="submit">Upload Movie</button>
            </form>
          </div>
        )}

        {tab === "series" && (
          <div className={styles.card}>
            {!seriesId && (
              <form onSubmit={handleCreateSeries}>
                <p className={styles.subHeading}>Step 1 — Create Series</p>
                <label className={styles.label}>Title</label>
                <input className={styles.input} value={sTitle} onChange={(e) => setSTitle(e.target.value)} required />

                <label className={styles.label}>Description</label>
                <input className={styles.input} value={sDesc} onChange={(e) => setSDesc(e.target.value)} />

                <label className={styles.label}>Categories (comma-separated)</label>
                <input className={styles.input} value={sCategories} onChange={(e) => setSCategories(e.target.value)} placeholder="Comedy, Thriller" />

                <label className={styles.label}>Poster (optional)</label>
                <input className={styles.fileInput} type="file" accept="image/*" onChange={(e) => setSPoster(e.target.files[0])} />

                <button className={styles.submit} type="submit">Create Series</button>
              </form>
            )}

            {seriesId && !seasonId && (
              <form onSubmit={handleCreateSeason}>
                <p className={styles.subHeading}>Step 2 — Add Season</p>
                <label className={styles.label}>Season Number</label>
                <input className={styles.input} type="number" min="1" value={seasonNumber} onChange={(e) => setSeasonNumber(Number(e.target.value))} required />
                <button className={styles.submit} type="submit">Create Season</button>
              </form>
            )}

            {seriesId && seasonId && (
              <form onSubmit={handleUploadEpisode}>
                <p className={styles.subHeading}>Step 3 — Upload Episode {epNumber}</p>
                <label className={styles.label}>Episode Title (optional)</label>
                <input className={styles.input} value={epTitle} onChange={(e) => setEpTitle(e.target.value)} />

                <label className={styles.label}>Video File</label>
                <input className={styles.fileInput} type="file" accept="video/*" onChange={(e) => setEpFile(e.target.files[0])} required />

                <button className={styles.submit} type="submit">Upload Episode</button>
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