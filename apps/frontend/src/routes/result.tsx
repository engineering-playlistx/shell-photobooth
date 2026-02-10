"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { usePhotobooth } from "../contexts/PhotoboothContext";
import { useNavigate } from "react-router-dom";
import type { ToastMessage } from "../components/ToastContainer";
import ToastContainer from "../components/ToastContainer";
import { supabase } from "../utils/supabase";
import { getAssetPath } from "../utils/assets";
import { usePrint } from "../hooks/usePrint";
import { savePhotoFile, savePhotoResult } from "../utils/database";

// TODO: Fix eslint
const API_BASE_URL =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3000";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_CLIENT_KEY = (import.meta as any).env?.VITE_API_CLIENT_KEY || "";
// TODO: Move to environment variables
const SUPABASE_BUCKET = "photobooth-bucket";
const SUPABASE_FOLDER = "public";

function base64ToBlob(base64: string, contentType = "", sliceSize = 512) {
  const byteCharacters = atob(base64.split(",")[1]);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
}

export default function ResultPage() {
  const { finalPhoto, selectedTheme, userInfo } = usePhotobooth();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasSaved = useRef(false);
  const [savedPhotoPath, setSavedPhotoPath] = useState<string | null>(null);
  const photoUuid = useMemo(() => crypto.randomUUID(), []);
  const photoFileName = useMemo(
    () =>
      `${photoUuid}-${userInfo?.name.trim().replace(/[^a-zA-Z0-9]/g, "-")}.png`,
    [photoUuid, userInfo?.name],
  );

  const addToast = (message: string, type: "success" | "error") => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const downloadPhoto = () => {
    if (!finalPhoto || !userInfo) {
      addToast("Photo or user information is missing.", "error");
      return;
    }

    try {
      const blob = base64ToBlob(finalPhoto, "image/png");
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = photoFileName;
      a.style.display = "none";
      document.body.appendChild(a);
      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      a.dispatchEvent(clickEvent);

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 200);
    } catch (error) {
      console.error("Error downloading photo:", error);
      addToast("Failed to download photo. Please try again.", "error");
    }
  };

  const emailResult = async () => {
    if (!finalPhoto || !selectedTheme || !userInfo) return;

    setIsSubmitting(true);

    try {
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg"];

      const base64Match = finalPhoto.match(
        /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/,
      );
      if (!base64Match) {
        addToast("Invalid image format.", "error");
        setIsSubmitting(false);
        return;
      }

      const mimeType = base64Match[1];
      if (!ALLOWED_TYPES.includes(mimeType)) {
        addToast(
          "Invalid image format. Only PNG and JPEG are allowed.",
          "error",
        );
        setIsSubmitting(false);
        return;
      }

      const base64String = base64Match[2];
      const fileSize = (base64String.length * 3) / 4;
      if (fileSize > MAX_FILE_SIZE) {
        addToast(
          `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.`,
          "error",
        );
        setIsSubmitting(false);
        return;
      }

      const blob = base64ToBlob(finalPhoto, mimeType);
      const filePath = `${SUPABASE_FOLDER}/${photoFileName}`;

      const { error: uploadError } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(filePath, blob, {
          contentType: mimeType,
          upsert: false,
        });

      if (
        uploadError &&
        uploadError.message !== "The resource already exists"
      ) {
        console.error("Supabase upload error:", uploadError);
        addToast("Failed to upload photo. Please try again.", "error");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/photo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_CLIENT_KEY}`,
        },
        body: JSON.stringify({
          photoPath: filePath,
          name: userInfo.name,
          email: userInfo.email,
          phone: userInfo.phone,
          selectedTheme: selectedTheme?.theme,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        await supabase.storage.from(SUPABASE_BUCKET).remove([filePath]);
        addToast(
          data.error || "Failed to submit photo. Please try again.",
          "error",
        );
        return;
      }

      addToast("Photo sent successfully! Check your email.", "success");
    } catch (error) {
      console.error("Error submitting photo:", error);
      addToast(
        "Network error. Please check your connection and try again.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // printing feature
  const { print } = usePrint();
  const hasAutoPrinted = useRef(false);

  const handlePrint = async () => {
    try {
      if (!savedPhotoPath) {
        addToast("Photo not saved yet. Please wait.", "error");
        return;
      }
      const result = await print(savedPhotoPath);
      if (result.success) {
        console.log("Print successful!");
        if (result.filepath) {
          console.log("pdf saved to:", result.filepath);
        }
      } else {
        console.error("Print failed:", result.error);
        addToast(`Print failed: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("Print error", error);
      addToast(`Print error`, "error");
    }
  };

  const handlePrintButtonClicked = () => {
    void handlePrint();
  };

  // No longer needed - auto-print is now triggered after photo is saved to disk

  // Auto-save photo result to database when page loads
  useEffect(() => {
    if (hasSaved.current || !finalPhoto || !selectedTheme || !userInfo) {
      return;
    }

    const saveToDatabase = async () => {
      try {
        hasSaved.current = true;

        const photoPath = await savePhotoFile(finalPhoto, photoFileName);
        setSavedPhotoPath(photoPath);

        await savePhotoResult({
          photoPath,
          selectedTheme,
          userInfo,
        });

        console.log("Photo result saved to database successfully");

        // Auto-print after photo is saved to disk (with delay to ensure file is written)
        if (!hasAutoPrinted.current) {
          hasAutoPrinted.current = true;
          setTimeout(() => {
            void (async () => {
              try {
                const result = await print(photoPath);
                if (result.success) {
                  console.log("Auto-print successful!");
                  if (result.filepath) {
                    console.log("pdf saved to:", result.filepath);
                  }
                } else {
                  console.error("Auto-print failed:", result.error);
                  addToast(`Print failed: ${result.error}`, "error");
                }
              } catch (error) {
                console.error("Auto-print error", error);
                addToast(`Print error`, "error");
              }
            })();
          }, 1000); // 1 second delay
        }
      } catch (error) {
        console.error("Failed to save photo result to database:", error);
        addToast(
          "Failed to save photo result locally. Please try again.",
          "error",
        );
        hasSaved.current = false;
      }
    };

    void saveToDatabase();
  }, [finalPhoto, selectedTheme, userInfo, photoFileName]);

  return (
    <div className="h-svh aspect-9/16 mx-auto relative flex items-center justify-center bg-primary text-secondary">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${getAssetPath("/images/bg_result.png")}')`,
        }}
      />
      <div className="relative z-10 w-full px-36 mx-auto mb-40">
        <div className="flex flex-col items-center gap-8">
          <h1 className="text-8xl font-black text-tertiary">Ready to Race!</h1>
          <div className="w-full h-[1200px] py-4">
            {!!finalPhoto && !!selectedTheme && (
              <img
                src={finalPhoto}
                // src="/images/_for-testing/frame-1.png"
                alt="Final photo"
                // add print area class for printing
                className="w-full h-auto rounded-lg shadow-lg print-area"
              />
            )}
          </div>
          <div className="text-center grid grid-cols-2 gap-8 w-full">
            <button
              type="button"
              className="px-7 py-5 bg-white text-secondary rounded-lg font-medium text-5xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
              onClick={() => void navigate("/")}
            >
              Back to Home
            </button>
            <button
              type="button"
              className="px-7 py-5 bg-tertiary text-white rounded-lg font-medium text-5xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
              onClick={() => void emailResult()}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Email Result"}
            </button>
            {process.env.NODE_ENV === "development" && (
              <button
                type="button"
                className="px-7 py-5 bg-white text-secondary rounded-lg font-medium text-5xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
                onClick={downloadPhoto}
              >
                Download
              </button>
            )}
            {process.env.NODE_ENV === "development" && (
              <button
                type="button"
                className="px-7 py-5 bg-white text-secondary rounded-lg font-medium text-5xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
                onClick={() => void handlePrintButtonClicked()}
              >
                Print
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
