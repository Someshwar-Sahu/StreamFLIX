import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function Catalog() {
  const [content, setContent] = useState([]);

  function fetchContent() {
    api.get("/content").then((res) => setContent(res.data));
  }

  useEffect(() => {
    fetchContent();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") fetchContent();
    });
    window.addEventListener("focus", fetchContent);
    return () => {
      document.removeEventListener("visibilitychange", fetchContent);
      window.removeEventListener("focus", fetchContent);
    };
  }, []);

  return (
    <div>
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