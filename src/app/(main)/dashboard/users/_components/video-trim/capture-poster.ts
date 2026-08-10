"use client";

const SEEK_TIMEOUT_MS = 1500;
const LOAD_TIMEOUT_MS = 4000;

// Idle <video> elements never decode/paint a frame on their own in most
// browsers (mobile Safari especially) — even with preload set. To get a
// thumbnail we have to actually seek (and briefly play, to wake the decoder)
// an offscreen video, then capture the frame to canvas.
export function captureVideoPosterFrame(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    const url = URL.createObjectURL(file);
    video.src = url;

    let settled = false;
    function finish(result: string | null) {
      if (settled) return;
      settled = true;
      clearTimeout(loadTimer);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      resolve(result);
    }

    const loadTimer = setTimeout(() => finish(null), LOAD_TIMEOUT_MS);

    video.addEventListener("error", () => finish(null));

    video.addEventListener("loadedmetadata", async () => {
      try {
        video.muted = true;
        try {
          await video.play();
          video.pause();
        } catch {
          // Ignore — seeking below still works without a successful play().
        }

        const target = Math.min(0.1, video.duration / 2 || 0);
        await new Promise<void>((res) => {
          let seekSettled = false;
          const onSeeked = () => {
            if (seekSettled) return;
            seekSettled = true;
            video.removeEventListener("seeked", onSeeked);
            clearTimeout(seekTimer);
            res();
          };
          const seekTimer = setTimeout(() => {
            if (seekSettled) return;
            seekSettled = true;
            video.removeEventListener("seeked", onSeeked);
            res();
          }, SEEK_TIMEOUT_MS);
          video.addEventListener("seeked", onSeeked);
          video.currentTime = target;
        });

        await new Promise((res) => requestAnimationFrame(res));

        const aspect = video.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : 1;
        const canvas = document.createElement("canvas");
        canvas.height = 128;
        canvas.width = Math.max(1, Math.round(128 * aspect));
        const ctx = canvas.getContext("2d");
        if (!ctx) return finish(null);

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        finish(canvas.toDataURL("image/jpeg", 0.7));
      } catch {
        finish(null);
      }
    });
  });
}
