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
    let lastProgressTime = 0;

    if (onCancelRef) {
      onCancelRef(() => {
        xhr.abort();
        reject(new Error("CANCELLED"));
      });
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const now = Date.now();
        if (now - lastProgressTime < 100 && event.loaded < event.total) return;
        lastProgressTime = now;

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

export async function uploadParallelMultipartToB2({ initData, file, onProgress, onCancelRef }) {
  const { content_id, bucket_name, s3_key, upload_id, part_urls } = initData;
  const activeXhrs = new Set();

  if (onCancelRef) {
    onCancelRef(() => {
      activeXhrs.forEach((xhr) => xhr.abort());
    });
  }

  const loadedPerPart = new Array(part_urls.length).fill(0);
  let lastProgressTime = 0;

  const updateOverallProgress = () => {
    if (!onProgress) return;
    const now = Date.now();
    const totalLoaded = loadedPerPart.reduce((a, b) => a + b, 0);
    if (now - lastProgressTime < 100 && totalLoaded < file.size) return;
    lastProgressTime = now;

    const percent = Math.min(99, Math.round((totalLoaded * 100) / file.size));
    const loadedMb = (totalLoaded / (1024 * 1024)).toFixed(1);
    const totalMb = (file.size / (1024 * 1024)).toFixed(1);
    onProgress({ percent, loadedMb, totalMb });
  };

  const completedParts = [];
  const CHUNK_SIZE = 16 * 1024 * 1024;
  const CONCURRENCY = 4;
  let partIndex = 0;

  async function uploadWorker() {
    while (partIndex < part_urls.length) {
      const currentIndex = partIndex++;
      const partInfo = part_urls[currentIndex];
      const partNum = partInfo.part_number;
      const start = (partNum - 1) * CHUNK_SIZE;
      const end = Math.min(file.size, partNum * CHUNK_SIZE);
      const chunk = file.slice(start, end);

      const etag = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        activeXhrs.add(xhr);

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            loadedPerPart[currentIndex] = evt.loaded;
            updateOverallProgress();
          }
        };

        xhr.onload = () => {
          activeXhrs.delete(xhr);
          if (xhr.status >= 200 && xhr.status < 300) {
            let e = xhr.getResponseHeader("ETag") || "";
            resolve({ PartNumber: partNum, ETag: e.replace(/"/g, "") });
          } else {
            reject(new Error(`Part ${partNum} upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          activeXhrs.delete(xhr);
          reject(new Error(`Part ${partNum} network error`));
        };
        xhr.onabort = () => {
          activeXhrs.delete(xhr);
          reject(new Error("CANCELLED"));
        };

        xhr.open("PUT", partInfo.upload_url, true);
        xhr.send(chunk);
      });

      completedParts.push(etag);
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, part_urls.length) }, () => uploadWorker());
  await Promise.all(workers);

  completedParts.sort((a, b) => a.PartNumber - b.PartNumber);
  return completedParts;
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
  const CHUNK_SIZE = 16 * 1024 * 1024;
  const totalParts = Math.ceil(file.size / CHUNK_SIZE);

  // Try High-Speed Parallel S3 Multipart Upload first for large files (> 16MB)
  if (totalParts > 1) {
    try {
      const initRes = await api.post("/content/presigned-multipart-init", {
        title,
        description,
        categoryNames,
        filename: file.name,
        file_size: file.size,
        total_parts: totalParts,
        content_type: file.type || "video/mp4",
      });

      const parts = await uploadParallelMultipartToB2({
        initData: initRes.data,
        file,
        onProgress,
        onCancelRef,
      });

      const compRes = await api.post(`/content/${initRes.data.content_id}/complete-multipart-upload`, {
        bucket_name: initRes.data.bucket_name,
        s3_key: initRes.data.s3_key,
        upload_id: initRes.data.upload_id,
        parts,
      });
      return compRes.data;
    } catch (err) {
      if (err.message === "CANCELLED") {
        throw err;
      }
      console.warn("Parallel multipart upload failed, falling back to single presigned upload:", err);
    }
  }

  // Fallback / Standard Single Presigned Direct B2 Upload
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
    // Standard proxy upload fallback
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
  const CHUNK_SIZE = 16 * 1024 * 1024;
  const totalParts = Math.ceil(file.size / CHUNK_SIZE);

  if (totalParts > 1) {
    try {
      const initRes = await api.post("/content/presigned-multipart-init", {
        title: title || `Episode ${episodeNumber}`,
        description: "",
        categoryNames: "",
        filename: file.name,
        file_size: file.size,
        total_parts: totalParts,
        content_type: file.type || "video/mp4",
      });

      const parts = await uploadParallelMultipartToB2({
        initData: initRes.data,
        file,
        onProgress,
        onCancelRef,
      });

      const compRes = await api.post(`/content/${initRes.data.content_id}/complete-multipart-upload`, {
        bucket_name: initRes.data.bucket_name,
        s3_key: initRes.data.s3_key,
        upload_id: initRes.data.upload_id,
        parts,
      });
      return compRes.data;
    } catch (err) {
      if (err.message === "CANCELLED") throw err;
      console.warn("Episode parallel multipart upload failed, falling back:", err);
    }
  }

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