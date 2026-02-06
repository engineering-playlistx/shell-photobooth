import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePhotobooth } from "../contexts/PhotoboothContext";
import { getAssetPath } from "../utils/assets";

const VIDEO_VERTICAL_OFFSET = [318, 798];
const MAX_RETAKE_COUNT = 2;

function CameraPage() {
  const navigate = useNavigate();
  const { setOriginalPhotos } = usePhotobooth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameImageRef = useRef<HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [retakeCount, setRetakeCount] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const capturedPhotosRef = useRef<HTMLImageElement[]>([]);

  const canvasWidth = 1080;
  const canvasHeight = 1920;
  const videoAspectRatio = 9 / 16;
  const videoHeight = canvasHeight * (480 / canvasHeight);
  const videoWidth = videoHeight / videoAspectRatio;
  const [verticalOffset, setVerticalOffset] = useState(
    VIDEO_VERTICAL_OFFSET[0],
  );

  useEffect(() => {
    void handleStartCamera();

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (frameImageRef.current) {
      return;
    }

    const frameImage = new window.Image();
    frameImage.crossOrigin = "anonymous";
    frameImage.src = getAssetPath("/images/frame.png");
    frameImageRef.current = frameImage;
  }, []);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    function drawFrame() {
      if (!canvas || !context) {
        animationFrameRef.current = window.requestAnimationFrame(drawFrame);
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);

      if (capturedPhotosRef.current.length === 0) {
        if (!video || video.readyState !== 4) {
          animationFrameRef.current = window.requestAnimationFrame(drawFrame);
          return;
        }

        context.save();
        context.translate(canvasWidth, 0);
        context.scale(-1, 1);
        const centerX = (canvasWidth - videoWidth) / 2;
        context.drawImage(
          video,
          centerX,
          verticalOffset,
          videoWidth,
          videoHeight,
        );
        context.restore();
      } else {
        capturedPhotosRef.current.forEach((photoImage, index) => {
          if (photoImage && photoImage.complete) {
            const centerX = (canvasWidth - videoWidth) / 2;
            context.drawImage(
              photoImage,
              centerX,
              VIDEO_VERTICAL_OFFSET[index],
              videoWidth,
              videoHeight,
            );
          }
        });

        if (
          capturedPhotosRef.current.length === 1 &&
          video &&
          video.readyState === 4
        ) {
          context.save();
          context.translate(canvasWidth, 0);
          context.scale(-1, 1);
          const centerX = (canvasWidth - videoWidth) / 2;
          context.drawImage(
            video,
            centerX,
            verticalOffset,
            videoWidth,
            videoHeight,
          );
          context.restore();
        }
      }

      if (frameImageRef.current && frameImageRef.current.complete) {
        context.drawImage(
          frameImageRef.current,
          0,
          0,
          canvas.width,
          canvas.height,
        );
      }

      if (countdownRef.current !== null && countdownRef.current > 0) {
        const countdownX = 280;
        const countdownY = verticalOffset + videoHeight - 48;

        context.save();
        const countdown = countdownRef.current.toString();
        context.font = "bold 52px sans-serif";
        context.textAlign = "left";
        context.textBaseline = "bottom";

        const textMetrics = context.measureText(countdown);
        const textWidth = textMetrics.width;
        const radius = Math.max(45, textWidth / 2 + 20);
        const circleCenterX = countdownX + textWidth / 2;
        const circleCenterY = countdownY - 30;

        context.beginPath();
        context.arc(
          circleCenterX,
          circleCenterY,
          radius,
          0,
          2 * Math.PI,
          false,
        );
        context.fillStyle = "#F2E9DABF";
        context.fill();
        context.lineWidth = 4;
        context.strokeStyle = "#9C774D";
        context.stroke();

        context.fillStyle = "#9C774D";
        context.font = "bold 52px sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(countdown, circleCenterX, circleCenterY);

        context.restore();
      }

      animationFrameRef.current = window.requestAnimationFrame(drawFrame);
    }

    drawFrame();

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCameraActive, verticalOffset, capturedPhotos]);

  async function handleStartCamera() {
    try {
      setError(null);

      if (videoRef.current) {
        const video = videoRef.current;
        video.pause();
        video.srcObject = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }

      if (
        !window.navigator.mediaDevices ||
        !window.navigator.mediaDevices.getUserMedia
      ) {
        throw new Error("Camera access is not supported in this browser");
      }

      const mediaStream = await window.navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;

      if (videoRef.current) {
        const video = videoRef.current;

        video.srcObject = mediaStream;

        const handleCanPlay = () => {
          video.removeEventListener("canplay", handleCanPlay);
          video.play().catch((err) => {
            if (err instanceof Error && err.name !== "AbortError") {
              console.error("Error playing video:", err);
            }
          });
        };

        video.addEventListener("canplay", handleCanPlay);

        if (video.readyState >= 3) {
          video.play().catch((err) => {
            if (err instanceof Error && err.name !== "AbortError") {
              console.error("Error playing video:", err);
            }
          });
        }
      }

      setIsCameraActive(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to access camera";
      setError(errorMessage);
      setIsCameraActive(false);
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !isCameraActive) {
      return;
    }

    const video = videoRef.current;
    if (video.readyState !== 4) {
      return;
    }

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = videoWidth;
    tempCanvas.height = videoHeight;
    const tempContext = tempCanvas.getContext("2d");

    if (!tempContext) {
      return;
    }

    tempContext.save();
    tempContext.translate(videoWidth, 0);
    tempContext.scale(-1, 1);
    tempContext.drawImage(video, 0, 0, videoWidth, videoHeight);
    tempContext.restore();

    const photoData = tempCanvas.toDataURL("image/png");

    const photoImage = new window.Image();
    photoImage.src = photoData;
    photoImage.onload = () => {
      capturedPhotosRef.current.push(photoImage);
      setCapturedPhotos((prev) => [...prev, photoData]);

      if (capturedPhotosRef.current.length === 1) {
        setVerticalOffset(VIDEO_VERTICAL_OFFSET[1]);
      } else if (capturedPhotosRef.current.length === 2) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => {
            track.stop();
          });
          streamRef.current = null;
        }
        setIsCameraActive(false);
      }
    };
  }

  function handleCapturePhoto() {
    if (!videoRef.current || !isCameraActive || countdown !== null) {
      return;
    }

    setCountdown(3);
    countdownRef.current = 3;
  }

  useEffect(() => {
    if (countdown === null) {
      countdownRef.current = null;
      return;
    }

    countdownRef.current = countdown;

    if (countdown === 0) {
      capturePhoto();
      setCountdown(null);
      countdownRef.current = null;
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  function handleRetake() {
    if (
      capturedPhotosRef.current.length === 0 ||
      retakeCount >= MAX_RETAKE_COUNT
    ) {
      return;
    }

    setRetakeCount((prev) => prev + 1);
    capturedPhotosRef.current.pop();
    setCapturedPhotos((prev) => prev.slice(0, -1));

    if (capturedPhotosRef.current.length === 0) {
      setVerticalOffset(VIDEO_VERTICAL_OFFSET[0]);
      if (!isCameraActive && streamRef.current === null) {
        void handleStartCamera();
      }
    } else if (capturedPhotosRef.current.length === 1) {
      setVerticalOffset(VIDEO_VERTICAL_OFFSET[1]);
      if (!isCameraActive && streamRef.current === null) {
        void handleStartCamera();
      }
    }
  }

  function handleNext() {
    if (capturedPhotos.length === 0 || !canvasRef.current) {
      return;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    setIsCameraActive(false);

    setOriginalPhotos(capturedPhotos);

    void navigate("/quiz");
  }

  return (
    <div className="h-svh aspect-9/16 mx-auto bg-primary text-secondary relative">
      <button
        onClick={() => {
          void navigate("/");
        }}
        className="absolute top-22 left-32 z-20 transition-all duration-200 active:scale-95 flex flex-col align-left items-start  gap-2 text-secondary text-2xl"
        aria-label="Back to home"
      >
        <div className="p-5 bg-secondary/80 hover:bg-secondary rounded-full shadow-lg transition-all duration-200 active:scale-95 flex flex-row">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </div>
        Homepage
      </button>
      <div className="w-full mx-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-yellow-400/10 backdrop-blur-lg border border-yellow-400/20 rounded-2xl shadow-2xl">
          <div className="space-y-4">
            <div className="relative aspect-9/16 bg-secondary rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="w-full h-full object-contain bg-secondary"
              />
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="hidden"
              />
              <div className="z-10 absolute top-9/12 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer flex items-center justify-center gap-8 lg:gap-16 w-full">
                <button
                  onClick={handleRetake}
                  className="flex flex-col items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
                  aria-label="Retake photo"
                  disabled={
                    capturedPhotos.length <= 0 ||
                    retakeCount >= MAX_RETAKE_COUNT
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleRetake();
                    }
                  }}
                >
                  <img
                    src={getAssetPath("/images/retake.png")}
                    alt="Retake"
                    className="size-24 lg:size-36 object-contain"
                    style={{
                      filter:
                        "brightness(0) saturate(100%) invert(18%) sepia(13%) saturate(1234%) hue-rotate(314deg) brightness(95%) contrast(90%)",
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.filter =
                        "brightness(0) saturate(100%) invert(48%) sepia(23%) saturate(738%) hue-rotate(358deg) brightness(92%) contrast(87%)";
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.filter =
                        "brightness(0) saturate(100%) invert(18%) sepia(13%) saturate(1234%) hue-rotate(314deg) brightness(95%) contrast(90%)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter =
                        "brightness(0) saturate(100%) invert(18%) sepia(13%) saturate(1234%) hue-rotate(314deg) brightness(95%) contrast(90%)";
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.filter =
                        "brightness(0) saturate(100%) invert(48%) sepia(23%) saturate(738%) hue-rotate(358deg) brightness(92%) contrast(87%)";
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.filter =
                        "brightness(0) saturate(100%) invert(18%) sepia(13%) saturate(1234%) hue-rotate(314deg) brightness(95%) contrast(90%)";
                    }}
                    onTouchCancel={(e) => {
                      e.currentTarget.style.filter =
                        "brightness(0) saturate(100%) invert(18%) sepia(13%) saturate(1234%) hue-rotate(314deg) brightness(95%) contrast(90%)";
                    }}
                  />
                  <span className="text-secondary font-medium text-2xl lg:text-3xl absolute -bottom-4 font-sans">
                    Retake
                  </span>
                </button>
                <button
                  onClick={handleCapturePhoto}
                  className="size-24 lg:size-48 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
                  disabled={
                    capturedPhotos.length >= 2 ||
                    !isCameraActive ||
                    countdown !== null
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCapturePhoto();
                    }
                  }}
                >
                  <img
                    src={getAssetPath("/images/capture.png")}
                    alt="Capture"
                    className="transition-all duration-200 active:brightness-[1.3] active:hue-rotate-15"
                    style={{
                      filter:
                        "brightness(0) saturate(100%) invert(18%) sepia(13%) saturate(1234%) hue-rotate(314deg) brightness(95%) contrast(90%)",
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.filter =
                        "brightness(0) saturate(100%) invert(48%) sepia(23%) saturate(738%) hue-rotate(358deg) brightness(92%) contrast(87%)";
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.filter =
                        "brightness(0) saturate(100%) invert(18%) sepia(13%) saturate(1234%) hue-rotate(314deg) brightness(95%) contrast(90%)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter =
                        "brightness(0) saturate(100%) invert(18%) sepia(13%) saturate(1234%) hue-rotate(314deg) brightness(95%) contrast(90%)";
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.filter =
                        "brightness(0) saturate(100%) invert(48%) sepia(23%) saturate(738%) hue-rotate(358deg) brightness(92%) contrast(87%)";
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.filter =
                        "brightness(0) saturate(100%) invert(18%) sepia(13%) saturate(1234%) hue-rotate(314deg) brightness(95%) contrast(90%)";
                    }}
                    onTouchCancel={(e) => {
                      e.currentTarget.style.filter =
                        "brightness(0) saturate(100%) invert(18%) sepia(13%) saturate(1234%) hue-rotate(314deg) brightness(95%) contrast(90%)";
                    }}
                  />
                  <span className="text-secondary font-medium text-2xl font-sans">
                    Tap to capture
                  </span>
                </button>
                <button
                  onClick={handleNext}
                  className="flex flex-col items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
                  aria-label="Next"
                  disabled={capturedPhotos.length < 2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleNext();
                    }
                  }}
                >
                  <img
                    src={getAssetPath("/images/next.png")}
                    alt="Next"
                    className="size-24 lg:size-36 object-contain"
                    style={{
                      filter:
                        "brightness(0) saturate(100%) invert(18%) sepia(13%) saturate(1234%) hue-rotate(314deg) brightness(95%) contrast(90%)",
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.filter =
                        "brightness(0) saturate(100%) invert(48%) sepia(23%) saturate(738%) hue-rotate(358deg) brightness(92%) contrast(87%)";
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.filter =
                        "brightness(0) saturate(100%) invert(18%) sepia(13%) saturate(1234%) hue-rotate(314deg) brightness(95%) contrast(90%)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter =
                        "brightness(0) saturate(100%) invert(18%) sepia(13%) saturate(1234%) hue-rotate(314deg) brightness(95%) contrast(90%)";
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.filter =
                        "brightness(0) saturate(100%) invert(48%) sepia(23%) saturate(738%) hue-rotate(358deg) brightness(92%) contrast(87%)";
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.filter =
                        "brightness(0) saturate(100%) invert(18%) sepia(13%) saturate(1234%) hue-rotate(314deg) brightness(95%) contrast(90%)";
                    }}
                    onTouchCancel={(e) => {
                      e.currentTarget.style.filter =
                        "brightness(0) saturate(100%) invert(18%) sepia(13%) saturate(1234%) hue-rotate(314deg) brightness(95%) contrast(90%)";
                    }}
                  />
                  <span className="text-secondary font-medium text-2xl lg:text-3xl absolute -bottom-4 font-sans">
                    Next
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CameraPage;
