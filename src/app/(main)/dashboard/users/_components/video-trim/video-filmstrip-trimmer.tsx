"use client";

import { useEffect, useRef, useState } from "react";

type DragMode = "start" | "end" | "move";

type VideoFilmstripTrimmerProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  duration: number;
  range: [number, number];
  onRangeChange: (range: [number, number]) => void;
  disabled?: boolean;
};

const THUMBNAIL_COUNT = 10;
const MIN_CLIP_SECONDS = 0.5;

export function VideoFilmstripTrimmer({
  videoRef,
  duration,
  range,
  onRangeChange,
  disabled,
}: VideoFilmstripTrimmerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const dragRef = useRef<{ mode: DragMode; startClientX: number; startRange: [number, number] } | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || duration <= 0) return;
    let cancelled = false;

    async function generate(video: HTMLVideoElement) {
      const canvas = document.createElement("canvas");
      const aspect = video.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : 16 / 9;
      canvas.height = 96;
      canvas.width = Math.max(1, Math.round(96 * aspect));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const originalTime = video.currentTime;
      const wasMuted = video.muted;

      // iOS Safari won't reliably decode seeked frames for a video that has
      // never actually played, so nudge the decoder awake with a muted play/pause.
      video.muted = true;
      try {
        await video.play();
        video.pause();
      } catch {
        // Ignore — some browsers reject programmatic play(); seeking still works without it.
      } finally {
        video.muted = wasMuted;
      }
      if (cancelled) return;

      const frames: string[] = [];
      for (let i = 0; i < THUMBNAIL_COUNT; i++) {
        if (cancelled) return;
        const t = Math.min(duration - 0.05, Math.max(0, (duration * i) / THUMBNAIL_COUNT));
        const seeked = await seekTo(video, t);
        if (cancelled) return;
        if (seeked) await waitForNextFrame();
        if (cancelled) return;
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push(canvas.toDataURL("image/jpeg", 0.6));
        } catch {
          // Frame wasn't decodable at this timestamp — skip it rather than stalling the whole strip.
        }
      }

      if (!cancelled) {
        video.currentTime = originalTime;
        if (frames.length > 0) setThumbnails(frames);
      }
    }

    void generate(video);
    return () => {
      cancelled = true;
    };
  }, [videoRef, duration]);

  function timeFromClientX(clientX: number) {
    const container = containerRef.current;
    if (!container) return 0;
    const rect = container.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * duration;
  }

  function handlePointerDown(mode: DragMode, e: React.PointerEvent) {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { mode, startClientX: e.clientX, startRange: range };
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    const container = containerRef.current;
    if (!drag || !container || duration <= 0) return;

    if (drag.mode === "move") {
      const rect = container.getBoundingClientRect();
      const deltaTime = ((e.clientX - drag.startClientX) / rect.width) * duration;
      const clipLength = drag.startRange[1] - drag.startRange[0];
      const newStart = Math.min(Math.max(0, drag.startRange[0] + deltaTime), duration - clipLength);
      onRangeChange([newStart, newStart + clipLength]);
      return;
    }

    const time = timeFromClientX(e.clientX);
    if (drag.mode === "start") {
      const newStart = Math.min(time, range[1] - MIN_CLIP_SECONDS);
      onRangeChange([Math.max(0, newStart), range[1]]);
    } else {
      const newEnd = Math.max(time, range[0] + MIN_CLIP_SECONDS);
      onRangeChange([range[0], Math.min(duration, newEnd)]);
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  const startPct = duration > 0 ? (range[0] / duration) * 100 : 0;
  const endPct = duration > 0 ? (range[1] / duration) * 100 : 100;

  return (
    <div
      ref={containerRef}
      className="relative h-16 w-full touch-none select-none overflow-hidden rounded-md bg-neutral-900"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="flex h-full w-full">
        {thumbnails.length > 0 && duration > 0 ? (
          thumbnails.map((src, i) => (
            // biome-ignore lint/performance/noImgElement: filmstrip thumbnail from canvas data URL
            // biome-ignore lint/suspicious/noArrayIndexKey: thumbnails are a fixed-order, non-reorderable strip
            <img key={i} src={src} alt="" draggable={false} className="h-full min-w-0 flex-1 object-cover" />
          ))
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/40 text-xs">Loading preview...</div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 bg-black/70" style={{ width: `${startPct}%` }} />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 bg-black/70"
        style={{ width: `${100 - endPct}%` }}
      />

      <div
        className="absolute inset-y-0 cursor-grab touch-none border-yellow-400 border-y-2 active:cursor-grabbing"
        style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
        onPointerDown={(e) => handlePointerDown("move", e)}
      >
        <div
          onPointerDown={(e) => handlePointerDown("start", e)}
          className="absolute inset-y-0 left-0 flex w-4 cursor-ew-resize touch-none items-center justify-center rounded-l bg-yellow-400"
        >
          <span className="h-6 w-0.5 rounded-full bg-black/60" />
        </div>
        <div
          onPointerDown={(e) => handlePointerDown("end", e)}
          className="absolute inset-y-0 right-0 flex w-4 cursor-ew-resize touch-none items-center justify-center rounded-r bg-yellow-400"
        >
          <span className="h-6 w-0.5 rounded-full bg-black/60" />
        </div>
      </div>
    </div>
  );
}

const SEEK_TIMEOUT_MS = 1500;

// Resolves true if the browser confirmed the seek, false if it timed out
// (some mobile browsers can silently drop a `seeked` event mid-loop).
function seekTo(video: HTMLVideoElement, time: number): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;

    function finish(result: boolean) {
      if (settled) return;
      settled = true;
      video.removeEventListener("seeked", onSeeked);
      clearTimeout(timer);
      resolve(result);
    }

    function onSeeked() {
      finish(true);
    }

    const timer = setTimeout(() => finish(false), SEEK_TIMEOUT_MS);
    video.addEventListener("seeked", onSeeked);
    video.currentTime = time;
  });
}

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
