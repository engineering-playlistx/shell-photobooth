import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeModalProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function QRCodeModal({
  url,
  isOpen,
  onClose,
}: QRCodeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-12 flex flex-col items-center gap-8 shadow-xl">
        <h2 className="text-5xl font-bold text-secondary">Scan to Download</h2>
        <QRCodeSVG value={url} size={320} level="H" />
        <p className="text-3xl text-secondary/70 text-center max-w-md">
          Scan the QR code with your phone to download your photo
        </p>
        <button
          type="button"
          className="mt-2 px-10 py-4 text-4xl bg-tertiary text-white rounded-lg font-medium cursor-pointer select-none"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
