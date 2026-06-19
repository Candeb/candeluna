import { useEffect, useRef } from 'react'
import galaxyVideo from '../assets/galaxiavideo.mp4?url'
import './VideoScrollBackground.css'

function SeamlessVideoLoop({
  videoSrc,
  playbackRate = 0.82,
  crossfadeDuration = 1.8,
}) {
  const videoARef = useRef(null)
  const videoBRef = useRef(null)
  const activeIndex = useRef(0)
  const isCrossfading = useRef(false)

  useEffect(() => {
    const videos = [videoARef.current, videoBRef.current]
    if (!videos[0] || !videos[1]) return

    const resetVideo = (video, visible) => {
      video.style.transition = 'none'
      video.style.opacity = visible ? '1' : '0'
    }

    const startLoop = async () => {
      videos.forEach((video) => {
        video.playbackRate = playbackRate
      })

      resetVideo(videos[0], true)
      resetVideo(videos[1], false)

      try {
        await videos[0].play()
      } catch {
        // Autoplay puede fallar hasta la primera interacción.
      }
    }

    const crossfade = () => {
      if (isCrossfading.current) return
      isCrossfading.current = true

      const from = videos[activeIndex.current]
      const to = videos[activeIndex.current ^ 1]

      to.currentTime = 0
      to.style.transition = `opacity ${crossfadeDuration}s ease-in-out`
      from.style.transition = `opacity ${crossfadeDuration}s ease-in-out`
      to.style.opacity = '1'
      from.style.opacity = '0'

      to.play().catch(() => {})

      window.setTimeout(() => {
        activeIndex.current ^= 1
        isCrossfading.current = false
      }, crossfadeDuration * 1000)
    }

    const onTimeUpdate = (event) => {
      const video = event.currentTarget
      if (video !== videos[activeIndex.current]) return
      if (video.duration - video.currentTime <= crossfadeDuration + 0.15) {
        crossfade()
      }
    }

    videos.forEach((video) => {
      video.addEventListener('timeupdate', onTimeUpdate)
    })

    startLoop()

    return () => {
      videos.forEach((video) => {
        video.removeEventListener('timeupdate', onTimeUpdate)
      })
    }
  }, [videoSrc, playbackRate, crossfadeDuration])

  return (
    <>
      <video
        ref={videoARef}
        className="video-scroll-bg__video"
        src={videoSrc}
        muted
        playsInline
        preload="auto"
      />
      <video
        ref={videoBRef}
        className="video-scroll-bg__video"
        src={videoSrc}
        muted
        playsInline
        preload="auto"
      />
    </>
  )
}

export default function VideoScrollBackground({
  videoSrc = galaxyVideo,
}) {
  return (
    <div className="video-scroll-bg" aria-hidden="true">
      <div className="video-scroll-bg__layer">
        <SeamlessVideoLoop videoSrc={videoSrc} />
      </div>
      <div className="video-scroll-bg__shade" />
    </div>
  )
}
