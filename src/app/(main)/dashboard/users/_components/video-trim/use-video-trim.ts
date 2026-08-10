"use client";

import { useCallback, useState } from "react";

import type { FFmpeg } from "@ffmpeg/ffmpeg";

let ffmpegSingleton: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegSingleton) return ffmpegSingleton;

  if (!loadPromise) {
    loadPromise = (async () => {
      const [{ FFmpeg }, { toBlobURL }] = await Promise.all([import("@ffmpeg/ffmpeg"), import("@ffmpeg/util")]);

      const ffmpeg = new FFmpeg();
      const baseURL = "/ffmpeg";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      ffmpegSingleton = ffmpeg;
      return ffmpeg;
    })();
  }

  return loadPromise;
}

export function useVideoTrim() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [progress, setProgress] = useState(0);

  const trim = useCallback(async (file: File, startSec: number, endSec: number): Promise<File> => {
    setIsPreparing(true);
    setProgress(0);

    const { fetchFile } = await import("@ffmpeg/util");
    const ffmpeg = await getFFmpeg();

    setIsPreparing(false);
    setIsProcessing(true);

    const onProgress = ({ progress: p }: { progress: number }) => {
      setProgress(Math.min(1, Math.max(0, p)));
    };

    try {
      ffmpeg.on("progress", onProgress);

      const extension = file.name.match(/\.[^.]+$/)?.[0] ?? ".mp4";
      const inputName = `input${extension}`;
      const outputName = `output${extension}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));
      await ffmpeg.exec([
        "-ss",
        startSec.toFixed(2),
        "-i",
        inputName,
        "-t",
        (endSec - startSec).toFixed(2),
        "-c",
        "copy",
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      // Best-effort cleanup — a failure here doesn't affect the trimmed output we already read.
      await ffmpeg.deleteFile(inputName).catch(() => undefined);
      await ffmpeg.deleteFile(outputName).catch(() => undefined);

      const mimeType = file.type || "video/mp4";
      const blob = new Blob([data as unknown as BlobPart], { type: mimeType });
      const trimmedName = `${file.name.replace(/\.[^.]+$/, "")}-trimmed${extension}`;
      return new File([blob], trimmedName, { type: mimeType });
    } finally {
      ffmpeg.off("progress", onProgress);
      setIsProcessing(false);
    }
  }, []);

  return { trim, isPreparing, isProcessing, progress };
}
