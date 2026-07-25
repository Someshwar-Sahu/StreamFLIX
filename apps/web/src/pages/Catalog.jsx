import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function Catalog() {
  const [content, setContent] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);

  function fetchContent() {
    api.get("/content").then((res) => setContent(res.data));
  }

  function fetchContinueWatching() {
    api.get("/watch-history")
      .then((res) => setContinueWatching(res.data))
      .catch(() => setContinueWatching([]));
  }

  function removeItem(contentId){
    api.delete(`/watch-history/${contentId}`)
      .then(() => fetchContinueWatching())
      .catch(() => {})
  }

  function clearAll() {
    api.delete(`/watch-history`)
      .then(() => fetchContinueWatching())
      .catch(() => {})
  }

  useEffect(() => {
    fetchContent();
    fetchContinueWatching();
    function onVisible() {
      if (document.visibilityState === "visible") {
        fetchContent();
        fetchContinueWatching();
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  return (
    <div>
      {continueWatching.length > 0 && (
        <>
          <h2>
            Continue Watching{" "}
            <button onClick={clearAll} style={{ fontSize: "12px" }}>Clear All</button>
          </h2>
          <ul>
            {continueWatching.map((item) => {
              const pct = item.duration_seconds
                ? Math.min(100, Math.round((item.progress_seconds / item.duration_seconds) * 100))
                : 0;
              return (
                <li key={item.content_id}>
                  <Link to={`/watch/${item.content_id}`}>{item.title}</Link>
                  {" — "}
                  <div style={{ display: "inline-block", width: "120px", background: "#333", height: "4px" }}>
                    <div style={{ width: `${pct}%`, background: "#1e90ff", height: "4px" }} />
                  </div>
                  {" "}{pct}% {" "}
                  <button onClick={() => removeItem(item.content_id)} style={{ fontSize: "12px" }}>Remove</button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <h1>Catalog</h1>
      <ul>
        {content.map((item) => (
          <li key={item.id}>
            <Link to={`/watch/${item.id}`}>
              {item.title} — {item.status}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}