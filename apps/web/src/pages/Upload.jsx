import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function Upload() {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [file, setFile] = useState(null)
    const [error, setError] = useState("")
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()
        setError("")
        const formData = new FormData()
        formData.append("title", title)
        formData.append("description", description)
        formData.append("file", file)
        
        try{
            await api.post("/content", formData, {
                headers: {"Content-Type": "multipart/form-data"},
            })
            navigate("/")
        } catch (err){
            setError(err.response?.data?.detail || "Upload failed")
        }
    }

    return (
        <div>
            <h1>Upload</h1>
            <form onSubmit={handleSubmit}>
                <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
                <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files[0])} required />
                <button type="submit">Upload</button>
            </form>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    )
}