import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ARCHETYPES,
  CONTENT_TYPES,
  usePhotobooth,
} from "../contexts/PhotoboothContext";
import type { Archetype } from "../contexts/PhotoboothContext";
import { getAssetPath } from "../utils/assets";

const VIDOE_VERTICAL_OFFSET = [318, 798];
const LOADING_DURATION = process.env.NODE_ENV === "development" ? 1000 : 15000;

function getFrameNumberFromArchetype(archetype: Archetype): number {
  return Object.keys(ARCHETYPES).findIndex((key) => key === archetype) + 1;
}

function getWrappedLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const testWidth = context.measureText(testLine).width;
    if (testWidth > maxWidth && line.length > 0) {
      lines.push(line.trim());
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  if (line.trim().length > 0) {
    lines.push(line.trim());
  }
  return lines;
}

function drawWrappedLines(
  context: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
): number {
  lines.forEach((l, idx) => {
    context.fillText(l, x, y + idx * lineHeight);
  });
  return y + lines.length * lineHeight;
}

function LoadingPage() {
  const navigate = useNavigate();
  const { originalPhotos, quizResult, setFinalPhoto } = usePhotobooth();
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (
      processedRef.current ||
      !originalPhotos.length ||
      !quizResult ||
      originalPhotos.length < 2
    ) {
      return;
    }

    const currentQuizResult = quizResult;

    async function processImageWithFrame() {
      const frameNumber = getFrameNumberFromArchetype(
        currentQuizResult.archetype,
      );
      const isDarkBackground =
        currentQuizResult.archetype === "chill" ||
        currentQuizResult.archetype === "night";
      const framePath = getAssetPath(`/images/frame-${frameNumber}.png`);

      const canvasWidth = 1280;
      const canvasHeight = 1920;
      const videoAspectRatio = 9 / 16;
      const videoHeight = canvasHeight * (480 / canvasHeight);
      const videoWidth = videoHeight / videoAspectRatio;

      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

      try {
        const [photo1, photo2, frameImage] = await Promise.all([
          loadImage(originalPhotos[0]),
          loadImage(originalPhotos[1]),
          loadImage(framePath),
        ]);

        context.clearRect(0, 0, canvas.width, canvas.height);

        const centerX = (canvasWidth - videoWidth) / 2;

        context.drawImage(
          photo1,
          centerX,
          VIDOE_VERTICAL_OFFSET[0],
          videoWidth,
          videoHeight,
        );

        context.drawImage(
          photo2,
          centerX,
          VIDOE_VERTICAL_OFFSET[1],
          videoWidth,
          videoHeight,
        );

        context.drawImage(frameImage, 0, 0, canvas.width, canvas.height);

        if (isDarkBackground) {
          context.fillStyle = "#ffffff";
        } else {
          context.fillStyle = "#3f2b2e";
        }
        context.textAlign = "center";
        context.textBaseline = "middle";

        const contents = ARCHETYPES[currentQuizResult.archetype].contents;
        const contentKeys = Object.keys(contents);
        if (contentKeys.length >= 2) {
          const shuffledKeys = contentKeys
            .map((key) => ({ key, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ key }) => key);
          const randomKey1 = shuffledKeys[0];
          const randomKey2 = shuffledKeys[1];

          const items1 = contents[randomKey1 as keyof typeof contents];
          const items2 = contents[randomKey2 as keyof typeof contents];

          const text1 =
            Array.isArray(items1) && items1.length > 0
              ? items1[Math.floor(Math.random() * items1.length)]
              : "";
          const text2 =
            Array.isArray(items2) && items2.length > 0
              ? items2[Math.floor(Math.random() * items2.length)]
              : "";

          const maxTextWidth = canvasWidth * 0.45;

          const sectionSpacing = 12;
          const typeSpacing = 8;
          const lineHeight = 44;

          const type1 = CONTENT_TYPES[randomKey1 as keyof typeof CONTENT_TYPES];
          const type2 = CONTENT_TYPES[randomKey2 as keyof typeof CONTENT_TYPES];

          context.textAlign = "center";
          context.textBaseline = "middle";

          context.font = "bold italic 36px LOccitaneSerif";
          const type1Lines = getWrappedLines(context, type1, maxTextWidth);

          context.font = "italic 36px LOccitaneSerif";
          const text1Lines = getWrappedLines(context, text1, maxTextWidth);

          context.font = "bold italic 36px LOccitaneSerif";
          const type2Lines = getWrappedLines(context, type2, maxTextWidth);

          context.font = "italic 36px LOccitaneSerif";
          const text2Lines = getWrappedLines(context, text2, maxTextWidth);

          const totalLines =
            type1Lines.length +
            text1Lines.length +
            type2Lines.length +
            text2Lines.length;

          const maxLines = 6;

          const textInitialY =
            canvasHeight * (3 / 4) +
            sectionSpacing * 2 +
            Math.max(0, maxLines - totalLines - 1) * (lineHeight / 2);
          let currY = textInitialY;

          context.font = "bold italic 36px LOccitaneSerif";
          currY = drawWrappedLines(
            context,
            type1Lines,
            canvasWidth / 2,
            currY + typeSpacing,
            lineHeight,
          );

          context.font = "italic 36px LOccitaneSerif";
          currY = drawWrappedLines(
            context,
            text1Lines,
            canvasWidth / 2,
            currY + typeSpacing,
            lineHeight,
          );

          currY += sectionSpacing;

          context.font = "bold italic 36px LOccitaneSerif";
          currY = drawWrappedLines(
            context,
            type2Lines,
            canvasWidth / 2,
            currY + typeSpacing,
            lineHeight,
          );

          context.font = "italic 36px LOccitaneSerif";
          drawWrappedLines(
            context,
            text2Lines,
            canvasWidth / 2,
            currY + typeSpacing,
            lineHeight,
          );
        }

        const finalPhotoData = canvas.toDataURL("image/png");
        setFinalPhoto(finalPhotoData);
        processedRef.current = true;
      } catch (error) {
        console.error("Error processing image:", error);
      }
    }

    void processImageWithFrame();
  }, [originalPhotos, quizResult, setFinalPhoto]);

  useEffect(() => {
    setProgress(0);
    startTimeRef.current = Date.now();

    const updateProgress = () => {
      if (startTimeRef.current === null) return;

      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / LOADING_DURATION) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        if (intervalRef.current !== null) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        // @ts-expect-error - for debugging
        window.navigate = navigate;
        void navigate("/result");
      }
    };

    intervalRef.current = window.setInterval(updateProgress, 16);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startTimeRef.current = null;
    };
  }, []);

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
      <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 w-5/6 px-8 z-10">
        <div className="relative w-full h-20 rounded-xl bg-secondary overflow-hidden shadow-lg">
          <div
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-75 ease-linear rounded-lg"
            style={{ width: `${progress}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-sans font-medium text-3xl">
              Loading
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadingPage;
