"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

const MAX_AVATAR_DIMENSION = 256;

async function getCroppedImg(src: string, pixels: Area): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = MAX_AVATAR_DIMENSION;
  canvas.height = MAX_AVATAR_DIMENSION;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(
    img,
    pixels.x,
    pixels.y,
    pixels.width,
    pixels.height,
    0,
    0,
    MAX_AVATAR_DIMENSION,
    MAX_AVATAR_DIMENSION,
  );
  return canvas.toDataURL("image/jpeg", 0.85);
}

interface Props {
  imageSrc: string;
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

export function AvatarCropModal({ imageSrc, onConfirm, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [confirming, setConfirming] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setConfirming(true);
    try {
      const dataUrl = await getCroppedImg(imageSrc, croppedAreaPixels);
      onConfirm(dataUrl);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium opacity-80 active:opacity-60"
        >
          Cancel
        </button>
        <span className="text-sm font-semibold">Move and Scale</span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={confirming || !croppedAreaPixels}
          className="text-sm font-semibold text-primary disabled:opacity-40"
        >
          {confirming ? "Saving…" : "Choose"}
        </button>
      </div>

      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="flex items-center gap-3 px-6 py-5">
        <span className="text-sm text-white/50">−</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-primary"
        />
        <span className="text-sm text-white/50">+</span>
      </div>
    </div>
  );
}
