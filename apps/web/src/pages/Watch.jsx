import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Hls from "hls.js"

export default function Watch() {
    const { id } = useParams()
    const videoRef = useRef(null)

    useEffect(() => {
        const video = videoRef.current
        const src = `http://localhost:8000/media/${id}/master.m3u8`

        if(Hls.isSupported()){
            const hls = new Hls()
            hls.loadSource(src)
            hls.attachMedia(video)
            return () => hls.destroy()
        } else if (video.canPlayType("application/vnd.apple.mpegurl")){
            video.src = src
        }
    }, [id])

    return (
        <div>
            <h1>Watching content #{id}</h1>
            <video ref={videoRef} controls width="640" />
        </div>
    )
}