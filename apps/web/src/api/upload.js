import api from "./client";

export async function getPresignedUploadUrl({ title, description, categoryNames, filename, file_size, content_type }) {
  const res = await api.post("/content/presigned-upload-url", {
    title,
    description,
    categoryNames,
    filename,
    file_size,
    content_type: content_type || "video/mp4",
  });
  return res.data;
}

export function uploadDirectToB2({ uploadUrl, file, onProgress, onCancelRef }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onCancelRef) {
      onCancelRef(() => {
        xhr.abort();
        reject(new Error("CANCELLED"));
      });
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded * 100) / event.total);
        const loadedMb = (event.loaded / (1024 * 1024)).toFixed(1);
        const totalMb = (event.total / (1024 * 1024)).toFixed(1);
        onProgress({ percent, loadedMb, totalMb });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(true);
      } else {
        reject(new Error(`Direct upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Direct upload network error"));
    xhr.onabort = () => reject(new Error("CANCELLED"));

    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
    xhr.send(file);
  });
}

export async function completeDirectUpload(contentId, { s3Path, poster }) {
  const fd = new FormData();
  fd.append("s3_path", s3Path);
  if (poster) fd.append("poster", poster);
  const res = await api.post(`/content/${contentId}/complete-direct-upload`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function cancelDirectUpload(contentId) {
  try {
    await api.delete(`/content/${contentId}/cancel-upload`);
  } catch (e) {
    console.warn("Cancel upload cleanup failed:", e);
  }
}

export async function uploadMovie({ title, description, categoryNames, file, poster, onProgress, onCancelRef }) {
  const meta = await getPresignedUploadUrl({
    title,
    description,
    categoryNames,
    filename: file.name,
    file_size: file.size,
    content_type: file.type || "video/mp4",
  });

  if (meta.direct_b2) {
    try {
      await uploadDirectToB2({
        uploadUrl: meta.upload_url,
        file,
        onProgress,
        onCancelRef,
      });
      return await completeDirectUpload(meta.content_id, { s3Path: meta.relative_path, poster });
    } catch (err) {
      await cancelDirectUpload(meta.content_id);
      throw err;
    }
  } else {
    // Fallback to proxy upload
    const fd = new FormData();
    fd.append("title", title);
    if (description) fd.append("description", description);
    if (categoryNames) fd.append("category_names", categoryNames);
    fd.append("file", file);
    if (poster) fd.append("poster", poster);
    return api.post("/content", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          const loadedMb = (progressEvent.loaded / (1024 * 1024)).toFixed(1);
          const totalMb = (progressEvent.total / (1024 * 1024)).toFixed(1);
          onProgress({ percent, loadedMb, totalMb });
        }
      },
    });
  }
}

export async function createSeries({ title, description, categoryNames, poster }) {
  const fd = new FormData();
  fd.append("title", title);
  if (description) fd.append("description", description);
  if (categoryNames) fd.append("category_names", categoryNames);
  if (poster) fd.append("poster", poster);
  const res = await api.post("/series", fd, { headers: { "Content-Type": "multipart/form-data" } });
  return res.data;
}

export async function createSeason(seriesId, seasonNumber) {
  const fd = new FormData();
  fd.append("season_number", seasonNumber);
  const res = await api.post(`/series/${seriesId}/seasons`, fd, { headers: { "Content-Type": "multipart/form-data" } });
  return res.data;
}

export async function uploadEpisode(seriesId, seasonId, { episodeNumber, title, file, onProgress, onCancelRef }) {
  const meta = await getPresignedUploadUrl({
    title: title || `Episode ${episodeNumber}`,
    description: "",
    categoryNames: "",
    filename: file.name,
    file_size: file.size,
    content_type: file.type || "video/mp4",
  });

  if (meta.direct_b2) {
    try {
      await uploadDirectToB2({
        uploadUrl: meta.upload_url,
        file,
        onProgress,
        onCancelRef,
      });
      return await completeDirectUpload(meta.content_id, { s3Path: meta.relative_path });
    } catch (err) {
      await cancelDirectUpload(meta.content_id);
      throw err;
    }
  } else {
    const fd = new FormData();
    fd.append("episode_number", episodeNumber);
    if (title) fd.append("title", title);
    fd.append("file", file);
    return api.post(`/series/${seriesId}/seasons/${seasonId}/episodes`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          const loadedMb = (progressEvent.loaded / (1024 * 1024)).toFixed(1);
          const totalMb = (progressEvent.total / (1024 * 1024)).toFixed(1);
          onProgress({ percent, loadedMb, totalMb });
        }
      },
    });
  }
}