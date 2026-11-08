import React from 'react'

const getEmbedUrl = url => {
  if (!url) return ''
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : url
}

export const VideoPlayer = ({
  title,
  videoUrl = 'https://www.youtube.com/watch?v=_Q1GHkADadc',
  compact = false,
}) => {
  const embedUrl = getEmbedUrl(videoUrl)

  if (compact) {
    return (
      <div className="bg-black border border-gray-800 rounded overflow-hidden w-full">
        {/* Minimalist video only */}
        <div className="relative pt-[56.25%]">
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={embedUrl}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black border border-gray-800 rounded overflow-hidden w-full">
      {/* Compact video player */}
      <div className="relative pt-[56.25%]">
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={embedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Minimal info section */}
      <div className="p-2 bg-gray-900 border-t border-gray-800">
        <h3 className="text-white text-xs font-medium truncate">{title}</h3>
        <p className="text-gray-500 text-[10px] mt-0.5">YouTube video</p>
      </div>
    </div>
  )
}

// Ultra-compact alternative (no info at all)
export const MiniVideoPlayer = ({
  title,
  videoUrl = 'https://www.youtube.com/watch?v=_Q1GHkADadc',
}) => {
  const embedUrl = getEmbedUrl(videoUrl)

  return (
    <div className="bg-black border border-gray-800 rounded overflow-hidden w-full">
      {/* No info, no border, just pure video */}
      <div className="relative pt-[56.25%]">
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={embedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  )
}
