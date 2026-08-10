"use client";

import { useEffect, useRef, useState } from "react";

import { AlertTriangle, Loader2, Pause, Play } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { estimateTrimmedSize, formatFileSize, formatTime, MAX_VIDEO_SIZE_BYTES } from "./constants";
import { useVideoTrim } from "./use-video-trim";
import { VideoFilmstripTrimmer } from "./video-filmstrip-trimmer";

type VideoTrimDialogProps = {
  open: boolean;
  file: File | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (trimmedFile: File) => void;
};

export function VideoTrimDialog({ open, file, onOpenChange, onConfirm }: VideoTrimDialogProps) {
  const [isBusy, setIsBusy] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(next) => !isBusy && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg" showCloseButton={!isBusy}>
        <DialogHeader>
          <DialogTitle>Trim Video</DialogTitle>
          <DialogDescription>
            Drag the handles below to select the part of the video you want to keep.
          </DialogDescription>
        </DialogHeader>

        {file && (
          <VideoTrimEditor
            key={`${file.name}-${file.size}-${file.lastModified}`}
            file={file}
            onBusyChange={setIsBusy}
            onCancel={() => onOpenChange(false)}
            onConfirm={(trimmed) => {
              onConfirm(trimmed);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type VideoTrimEditorProps = {
  file: File;
  onBusyChange: (busy: boolean) => void;
  onCancel: () => void;
  onConfirm: (trimmedFile: File) => void;
};

function VideoTrimEditor({ file, onBusyChange, onCancel, onConfirm }: VideoTrimEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const url = URL.createObjectURL(file);
    video.src = url;
    return () => {
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const [duration, setDuration] = useState(0);
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const { trim, isPreparing, isProcessing, progress } = useVideoTrim();
  const isBusy = isPreparing || isProcessing;

  function handleLoadedMetadata() {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
    setRange([0, video.duration]);
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;
    if (video.currentTime >= range[1]) {
      video.pause();
      video.currentTime = range[0];
      setIsPlaying(false);
    }
  }

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      return;
    }
    if (video.currentTime < range[0] || video.currentTime >= range[1]) {
      video.currentTime = range[0];
    }
    video.play();
    setIsPlaying(true);
  }

  function handleRangeChange(next: [number, number]) {
    setRange(next);
    const video = videoRef.current;
    if (video) video.currentTime = next[0];
  }

  async function handleConfirm() {
    onBusyChange(true);
    try {
      const trimmed = await trim(file, range[0], range[1]);
      if (trimmed.size > MAX_VIDEO_SIZE_BYTES) {
        toast.error(
          `Trimmed video is still ${formatFileSize(trimmed.size)}, over the 25MB limit. Try selecting a shorter clip.`,
        );
      }
      onConfirm(trimmed);
    } catch {
      toast.error("Couldn't trim this video. Please try a different clip.");
    } finally {
      onBusyChange(false);
    }
  }

  function confirmButtonLabel() {
    if (isPreparing) return "Preparing...";
    if (isProcessing) return `Trimming... ${Math.round(progress * 100)}%`;
    return "Trim & Save";
  }

  const selectedDuration = range[1] - range[0];
  const isFullClip = duration === 0 || (range[0] <= 0.05 && range[1] >= duration - 0.05);
  const estimatedSize = estimateTrimmedSize(file.size, duration, range);
  const overLimit = estimatedSize > MAX_VIDEO_SIZE_BYTES;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-lg bg-black">
        {/* biome-ignore lint/a11y/useMediaCaption: silent local preview of the vendor's own upload, edited before publishing */}
        <video
          ref={videoRef}
          className="max-h-72 w-full object-contain"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPause={() => setIsPlaying(false)}
          playsInline
        />
        <button
          type="button"
          onClick={togglePlayback}
          disabled={isBusy || duration === 0}
          className="absolute inset-0 flex items-center justify-center bg-black/20 text-white disabled:pointer-events-none"
        >
          <span className="rounded-full bg-black/50 p-3">
            {isPlaying ? <Pause className="size-6" /> : <Play className="size-6" />}
          </span>
        </button>
      </div>

      <p className="text-muted-foreground text-xs">
        {isFullClip ? "File size" : "Estimated trimmed size"}: {formatFileSize(estimatedSize)}
        {overLimit && " — over the 25MB limit"}
      </p>

      {overLimit && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-destructive text-xs">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>This clip is over 25MB. Trim it down to a shorter selection so it uploads reliably.</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <VideoFilmstripTrimmer
          videoRef={videoRef}
          duration={duration}
          range={range}
          onRangeChange={handleRangeChange}
          disabled={isBusy || duration === 0}
        />
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span>{formatTime(range[0])}</span>
          <span>Selected: {formatTime(selectedDuration)}</span>
          <span>{formatTime(range[1])}</span>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isBusy}>
          Cancel
        </Button>
        <Button type="button" onClick={handleConfirm} disabled={isBusy || duration === 0}>
          {isBusy && <Loader2 className="size-4 animate-spin" />}
          {confirmButtonLabel()}
        </Button>
      </DialogFooter>
    </div>
  );
}
