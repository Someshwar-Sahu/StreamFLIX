import api from "./client";

export async function getContentDetails(id) {
    const res = await api.get(`/content/${id}/details`)
    return res.data
}

export async function toggleWatchlist(contentId, inWatchlist) {
    if (inWatchlist) return api.delete(`/watchlist/content/${contentId}`)
    return api.post("watchlist", { content_id: contentId })
}

export async function rateContent(contentId, value) {
    return api.post("/ratings", { content_id: contentId, value })
}

export async function clearRating(contentId) {
    return api.delete(`/ratings/content/${contentId}`)
}

export async function getSeriesDetails(id) {
    const res = await api.get(`/series/${id}/details`)
    return res.data
}

export async function toggleSeriesWatchlist(seriesId, inWatchlist) {
    if(inWatchlist) return api.delete(`/watchlist/series/${seriesId}`)
    return api.post("watchlist", { series_id: seriesId })
}

export async function rateSeries(seriesId, value) {
    return api.post("/ratings", { series_id: seriesId, value })
}

export async function clearSeriesRating(seriesId) {
    return api.delete(`/ratings/series/${seriesId}`)
}