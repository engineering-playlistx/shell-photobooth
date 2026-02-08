import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePhotobooth } from "../contexts/PhotoboothContext";
import type { RacingTheme } from "../contexts/PhotoboothContext";
import { getAssetPath } from "../utils/assets";

// TODO: Fix eslint
const API_BASE_URL =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3000";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_CLIENT_KEY = (import.meta as any).env?.VITE_API_CLIENT_KEY || "";

const FRAME_MAP: Record<RacingTheme, string> = {
  pitcrew: "/images/frame-racing-pitcrew.png",
  motogp: "/images/frame-racing-motogp.png",
  f1: "/images/frame-racing-f1.png",
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      const label = src.startsWith("data:") ? "base64 image" : src;
      reject(new Error(`Failed to load image: ${label}`));
    };
    img.src = src;
  });
}

async function applyRacingFrame(
  aiGeneratedBase64: string,
  theme: RacingTheme,
): Promise<string> {
  const canvasWidth = 1280;
  const canvasHeight = 1920;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  const aiImage = await loadImage(aiGeneratedBase64);
  ctx.drawImage(aiImage, 0, 0, canvasWidth, canvasHeight);

  // Frame overlay is optional — skip if the image file doesn't exist
  try {
    const frameImage = await loadImage(getAssetPath(FRAME_MAP[theme]));
    ctx.drawImage(frameImage, 0, 0, canvasWidth, canvasHeight);
  } catch {
    console.warn(
      `[AI Generate] Frame image not found: ${FRAME_MAP[theme]} — skipping overlay`,
    );
  }

  return canvas.toDataURL("image/png");
}

function LoadingPage() {
  const navigate = useNavigate();
  const { originalPhotos, selectedTheme, setFinalPhoto } = usePhotobooth();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Preparing your photo...");
  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current || !originalPhotos.length || !selectedTheme) {
      return;
    }

    processedRef.current = true;

    async function generateAIPhoto() {
      try {
        const theme = selectedTheme!.theme;
        const photoSize = Math.round(originalPhotos[0].length / 1024);
        console.log(
          `[AI Generate] Starting — theme: ${theme}, photo size: ${photoSize}KB`,
        );
        console.log(`[AI Generate] API URL: ${API_BASE_URL}/api/ai-generate`);

        setStatusText("Uploading photo...");
        setProgress(15);

        const startTime = Date.now();

        const response = await fetch(`${API_BASE_URL}/api/ai-generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_CLIENT_KEY}`,
          },
          body: JSON.stringify({
            userPhotoBase64: originalPhotos[0],
            theme,
          }),
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(
          `[AI Generate] Response received — status: ${response.status} (${elapsed}s)`,
        );

        setStatusText("AI is generating your photo...");
        setProgress(50);

        const rawText = await response.text();
        console.log(
          `[AI Generate] Response body length: ${rawText.length} chars`,
        );

        let data: Record<string, unknown>;
        try {
          data = JSON.parse(rawText) as Record<string, unknown>;
        } catch {
          console.error(
            "[AI Generate] Failed to parse JSON. Raw response:",
            rawText.substring(0, 500),
          );
          throw new Error(
            `Server returned invalid JSON (status ${response.status})`,
          );
        }

        if (!response.ok) {
          console.error("[AI Generate] API error:", data);
          throw new Error((data.error as string) || "Failed to generate photo");
        }

        if (!data.generatedImageBase64) {
          console.error(
            "[AI Generate] Missing generatedImageBase64 in response. Keys:",
            Object.keys(data),
          );
          throw new Error("Server response missing generated image data");
        }

        const imageDataLength = (data.generatedImageBase64 as string).length;
        console.log(
          `[AI Generate] Got generated image — ${Math.round(imageDataLength / 1024)}KB`,
        );

        setStatusText("Applying racing frame...");
        setProgress(80);

        const framedPhoto = await applyRacingFrame(
          data.generatedImageBase64 as string,
          theme,
        );
        console.log(
          `[AI Generate] Frame applied — total time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`,
        );

        setProgress(100);
        setFinalPhoto(framedPhoto);

        setTimeout(() => {
          void navigate("/result");
        }, 500);
      } catch (err) {
        console.error("[AI Generate] Failed:", err);
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setError(message);
        processedRef.current = false;
      }
    }

    void generateAIPhoto();
  }, [originalPhotos, selectedTheme, setFinalPhoto, navigate]);

  const handleRetry = () => {
    setError(null);
    setProgress(0);
    processedRef.current = false;
  };

  return (
    <div className="h-svh aspect-9/16 mx-auto relative flex items-center justify-center p-4 bg-black overflow-hidden">
      <video
        autoPlay
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={getAssetPath("/videos/kv2.mp4")} type="video/mp4" />
      </video>

      {error ? (
        <div className="relative z-10 flex flex-col items-center gap-8 px-12">
          <p className="text-white text-3xl font-sans text-center">{error}</p>
          <div className="flex gap-6">
            <button
              type="button"
              onClick={handleRetry}
              className="px-10 py-5 bg-white hover:bg-gray-200 text-secondary rounded-lg font-medium text-3xl transition-all duration-200 cursor-pointer font-sans"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => void navigate("/")}
              className="px-10 py-5 bg-transparent hover:bg-white/20 text-white border border-white rounded-lg font-medium text-3xl transition-all duration-200 cursor-pointer font-sans"
            >
              Back to Home
            </button>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 w-5/6 px-8 z-10">
          <div className="relative w-full h-20 rounded-xl bg-secondary overflow-hidden shadow-lg">
            <div
              className="absolute top-0 left-0 h-full bg-primary transition-all duration-300 ease-linear rounded-lg"
              style={{ width: `${progress}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-sans font-medium text-3xl">
                {statusText}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoadingPage;
