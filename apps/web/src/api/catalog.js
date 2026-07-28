import api from "./client";

export async function getContent({ q, category } ={}) {
    const params = {}
    if (q) params.q = q
    if (category) params.category = category
    const res = await api.get("/content", { params })
    return res.data
}

export async function getSeries() {
    const res = await api.get("/series")
    return res.data
}

export async function getTrending() {
    const res = await api.get("/content/trending")
    return res.data
}

export async function getCategories() {
    const res = await api.get("/categories")
    return res.data
}