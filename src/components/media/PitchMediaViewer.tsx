'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Video, 
  Presentation, 
  ImageIcon, 
  ExternalLink, 
  Maximize2, 
  X, 
  Play, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  // Support standard, shortened, and embed links
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regExp);
  return match && match[1] ? `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1` : null;
}

export function getPresentationEmbedUrl(url?: string): string | null {
  if (!url) return null;
  if (url.includes('docs.google.com/presentation/d/')) {
    // Transform Google Slides link to clean embed URL
    return url
      .replace(/\/edit.*$/, '/embed?start=false&loop=false&delayms=3000')
      .replace(/\/pub.*$/, '/embed?start=false&loop=false&delayms=3000');
  }
  return url;
}

interface PitchMediaViewerProps {
  pitchVideoUrl?: string;
  pitchDeckUrl?: string;
  images?: string[];
  startupName: string;
  isEditable?: boolean;
  onEditClick?: () => void;
}

export function PitchMediaViewer({
  pitchVideoUrl,
  pitchDeckUrl,
  images = [],
  startupName,
  isEditable = false,
  onEditClick
}: PitchMediaViewerProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'deck' | 'images'>(() => {
    if (pitchVideoUrl) return 'video';
    if (pitchDeckUrl) return 'deck';
    if (images && images.length > 0) return 'images';
    return 'video';
  });

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isDeckFullscreen, setIsDeckFullscreen] = useState(false);

  const youtubeEmbedUrl = getYouTubeEmbedUrl(pitchVideoUrl);
  const presentationEmbedUrl = getPresentationEmbedUrl(pitchDeckUrl);
  const hasImages = images && images.length > 0;
  const hasAnyMedia = Boolean(youtubeEmbedUrl || pitchDeckUrl || hasImages);

  return (
    <div className="glass-panel p-6 border border-white/10 space-y-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Pitch Assets & Presentation Media</span>
            </h3>
            {isEditable && onEditClick && (
              <button
                onClick={onEditClick}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Edit Pitch Video, PPT & Images"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Watch the founder pitch, review the pitch deck slides, and inspect product screenshots.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'video'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video Pitch</span>
            {youtubeEmbedUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>

          <button
            onClick={() => setActiveTab('deck')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'deck'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>PPT / Deck</span>
            {pitchDeckUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>

          <button
            onClick={() => setActiveTab('images')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'images'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Images ({images.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Video Pitch */}
      {activeTab === 'video' && (
        <div>
          {youtubeEmbedUrl ? (
            <div className="space-y-3">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                <iframe
                  src={youtubeEmbedUrl}
                  title={`${startupName} Video Pitch`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Play className="w-3.5 h-3.5" />
                  <span>Streamed directly from YouTube (HD 1080p supported)</span>
                </span>
                {pitchVideoUrl && (
                  <a
                    href={pitchVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white flex items-center gap-1 text-slate-400 underline underline-offset-2"
                  >
                    <span>Open in YouTube</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">No Pitch Video Linked Yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {isEditable
                    ? 'Paste a YouTube video link to showcase your product demo or founder pitch to investors and builders.'
                    : 'The founder has not linked a pitch video for this venture yet.'}
                </p>
              </div>
              {isEditable && onEditClick && (
                <Button variant="glow" size="sm" onClick={onEditClick} className="mt-2">
                  <Video className="w-3.5 h-3.5 mr-1.5" />
                  <span>Add Pitch Video Link</span>
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: PPT / Slide Deck */}
      {activeTab === 'deck' && (
        <div>
          {presentationEmbedUrl ? (
            <div className="space-y-3">
              <div className="relative w-full aspect-[16/10] min-h-[420px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/90">
                <iframe
                  src={presentationEmbedUrl}
                  title={`${startupName} Pitch Deck`}
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 px-1">
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <Presentation className="w-3.5 h-3.5" />
                  <span>Interactive slide presentation • Click slides to advance</span>
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsDeckFullscreen(true)}
                    className="flex items-center gap-1 text-slate-300 hover:text-white"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Cinema Mode</span>
                  </button>
                  {pitchDeckUrl && (
                    <a
                      href={pitchDeckUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-slate-300 hover:text-white underline underline-offset-2"
                    >
                      <span>Open External Deck</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
                <Presentation className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">No Presentation Deck Linked</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {isEditable
                    ? 'Attach a Google Slides, Pitch.com, or PDF slide deck URL so prospective investors can review the deck before committing capital.'
                    : 'The founder has not attached a presentation slide deck for this venture yet.'}
                </p>
              </div>
              {isEditable && onEditClick && (
                <Button variant="glow" size="sm" onClick={onEditClick} className="mt-2">
                  <Presentation className="w-3.5 h-3.5 mr-1.5" />
                  <span>Add Presentation / PPT Link</span>
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Images & Architecture Screenshots */}
      {activeTab === 'images' && (
        <div>
          {hasImages ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((imgUrl, i) => (
                <div
                  key={i}
                  onClick={() => setLightboxImage(imgUrl)}
                  className="group relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/40 cursor-pointer hover:border-indigo-500/50 transition-all shadow-lg"
                >
                  <Image
                    src={imgUrl}
                    alt={`${startupName} screenshot ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-lg bg-black/80 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">No Screenshots Uploaded</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {isEditable
                    ? 'Add URLs of high-resolution product screenshots, architecture diagrams, or Figma mockups.'
                    : 'No screenshots uploaded for this venture yet.'}
                </p>
              </div>
              {isEditable && onEditClick && (
                <Button variant="glow" size="sm" onClick={onEditClick} className="mt-2">
                  <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
                  <span>Add Screenshot URLs</span>
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal for Screenshots */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full aspect-video rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
            <Image
              src={lightboxImage}
              alt="Screenshot Preview"
              fill
              className="object-contain"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Deck Modal */}
      {isDeckFullscreen && presentationEmbedUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex flex-col p-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 text-white">
            <div className="flex items-center gap-2">
              <Presentation className="w-5 h-5 text-indigo-400" />
              <span className="font-bold text-sm">{startupName} — Fullscreen Pitch Deck</span>
            </div>
            <button
              onClick={() => setIsDeckFullscreen(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs"
            >
              <X className="w-4 h-4" />
              <span>Close Cinema Mode</span>
            </button>
          </div>
          <div className="flex-1 mt-3 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black">
            <iframe
              src={presentationEmbedUrl}
              title={`${startupName} Presentation Deck`}
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}

    </div>
  );
}
