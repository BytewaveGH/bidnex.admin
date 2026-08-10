export const MAX_VIDEO_SIZE_BYTES = 25 * 1024 * 1024;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function formatTime(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function estimateTrimmedSize(fileSize: number, totalDuration: number, range: [number, number]): number {
  if (totalDuration <= 0) return fileSize;
  const selected = Math.max(0, range[1] - range[0]);
  return Math.round(fileSize * Math.min(1, selected / totalDuration));
}
