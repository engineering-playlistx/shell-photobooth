"use client";

import React, { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type,
  onClose,
  duration = 5000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-50 px-8 py-4 rounded-lg shadow-lg font-sans text-2xl min-w-[400px] text-center ${
        type === "success"
          ? "bg-[#65C89A] text-secondary"
          : "bg-[#C67573] text-secondary"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <span>{message}</span>
        <button
          onClick={onClose}
          className="text-secondary hover:text-gray-800 font-bold text-3xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
