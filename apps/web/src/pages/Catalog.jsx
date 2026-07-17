import { useState, useEffect } from "react";
import { Link } from "react-router-dom"
import api from "../api/client";

export default function Catalog() {
    const [content, setContent] = useState([])

    useEffect(() => {
        api.get("/content").then((res) => setContent(res.data))
    }, [])

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
    )
}