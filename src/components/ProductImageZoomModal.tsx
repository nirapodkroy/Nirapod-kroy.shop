import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Tag,
  Maximize2,
  Move
} from "lucide-react";
import { handleProductImageError } from "../utils/imageHelper";

interface ProductImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  imageCodes?: { url: string; code: string }[];
  initialIndex?: number;
  productTitle: string;
  language: "bn" | "en";
}

export const ProductImageZoomModal: React.FC<ProductImageZoomModalProps> = ({
  isOpen,
  onClose,
  images,
  imageCodes = [],
  initialIndex = 0,
  productTitle,
  language
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync initial index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex]);

  // Reset scale and position when switching images
  const handleSelectImage = (idx: number) => {
    setCurrentIndex(idx);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handlePrev = () => {
    const nextIdx = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    handleSelectImage(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    handleSelectImage(nextIdx);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(3.5, Number((prev + 0.5).toFixed(1))));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(1, Number((prev - 0.5).toFixed(1)));
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleDoubleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scale > 1) {
      handleResetZoom();
    } else {
      setScale(2.2);
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - rect.width / 2;
        const offsetY = e.clientY - rect.top - rect.height / 2;
        setPosition({ x: -offsetX * 0.8, y: -offsetY * 0.8 });
      }
    }
  };

  // Keyboard navigation & zoom shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-" || e.key === "_") {
        handleZoomOut();
      } else if (e.key === "0" || e.key.toLowerCase() === "r") {
        handleResetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  // Drag pan handlers when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    const maxBound = (scale - 1) * 350;
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    setPosition({
      x: Math.max(-maxBound, Math.min(maxBound, newX)),
      y: Math.max(-maxBound, Math.min(maxBound, newY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  const currentImage = images[currentIndex] || "";
  const currentCode = imageCodes[currentIndex]?.code || `#${currentIndex + 1}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex flex-col justify-between bg-black/95 text-white select-none">
        {/* Top Control Bar */}
        <div className="relative z-20 flex items-center justify-between p-3 sm:p-5 bg-gradient-to-b from-black/80 to-transparent">
          {/* Info Badge */}
          <div className="flex items-center gap-2.5 truncate max-w-[60%] sm:max-w-md">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-800/90 border border-zinc-700/80 text-xs font-mono text-zinc-300">
              {currentIndex + 1} / {images.length}
            </span>
            {currentCode && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>{language === "bn" ? "কোড" : "Code"}: {currentCode}</span>
              </span>
            )}
            <span className="hidden md:inline text-xs text-zinc-400 truncate font-medium">
              {productTitle}
            </span>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Zoom Out Button */}
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="p-2 sm:p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800/80 text-white transition-all active:scale-95 cursor-pointer"
              title={language === "bn" ? "জুম কমান (-)" : "Zoom Out (-)"}
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Current Scale Indicator */}
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2.5 py-1 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 text-xs font-mono text-emerald-400 font-bold transition-all active:scale-95 cursor-pointer"
              title={language === "bn" ? "রিসেট জুম (100%)" : "Reset Zoom"}
            >
              {Math.round(scale * 100)}%
            </button>

            {/* Zoom In Button */}
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 3.5}
              className="p-2 sm:p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800/80 text-white transition-all active:scale-95 cursor-pointer"
              title={language === "bn" ? "জুম বাড়ান (+)" : "Zoom In (+)"}
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Reset View */}
            {scale > 1 && (
              <button
                type="button"
                onClick={handleResetZoom}
                className="hidden sm:flex p-2 sm:p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                title={language === "bn" ? "রিসেট (R)" : "Reset (R)"}
                aria-label="Reset Zoom"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="ml-1 sm:ml-2 p-2 sm:p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 border border-rose-500/40 text-rose-300 hover:text-white transition-all active:scale-95 cursor-pointer"
              title={language === "bn" ? "বন্ধ করুন (Esc)" : "Close (Esc)"}
              aria-label="Close Fullscreen View"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Stage Image Viewer */}
        <div
          ref={containerRef}
          className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden cursor-zoom-in"
          onDoubleClick={handleDoubleTap}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in" }}
        >
          {/* Main Visual */}
          <div
            className="transition-transform duration-100 ease-out will-change-transform max-w-full max-h-full flex items-center justify-center p-2 sm:p-6"
            style={{
              transform: `translate3d(${position.x}px, ${position.y}px, 0px) scale(${scale})`,
            }}
          >
            <img
              src={currentImage}
              alt={productTitle}
              draggable={false}
              className="max-w-[92vw] max-h-[75vh] object-contain rounded-2xl shadow-2xl pointer-events-none select-none"
              referrerPolicy="no-referrer"
              onError={(e) => handleProductImageError(e, currentImage)}
            />
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-3 sm:p-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 text-white border border-zinc-700/60 shadow-xl backdrop-blur-md transition-all active:scale-95 cursor-pointer z-20"
                title={language === "bn" ? "পূর্ববর্তী ছবি (←)" : "Previous Photo (←)"}
                aria-label="Previous Photo"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-3 sm:p-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 text-white border border-zinc-700/60 shadow-xl backdrop-blur-md transition-all active:scale-95 cursor-pointer z-20"
                title={language === "bn" ? "পরবর্তী ছবি (→)" : "Next Photo (→)"}
                aria-label="Next Photo"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </>
          )}

          {/* Interactive Hint Indicator */}
          <div className="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none z-10">
            <span className="px-3.5 py-1.5 rounded-full bg-zinc-900/85 border border-zinc-700/60 text-zinc-300 text-xs font-medium shadow-lg backdrop-blur-md flex items-center gap-2">
              {scale > 1 ? (
                <>
                  <Move className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>{language === "bn" ? "ছবি সরাতে মাউস দিয়ে ড্র্যাগ করুন" : "Drag to pan image"}</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === "bn" ? "ডাবল ক্লিকে জুম করুন" : "Double-click or use buttons to zoom"}</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Bottom Thumbnail Strip */}
        {images.length > 1 && (
          <div className="relative z-20 p-3 sm:p-4 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-center gap-2 overflow-x-auto">
            <div className="flex items-center gap-2 sm:gap-3 p-1.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-md">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectImage(idx)}
                  className={`relative shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    currentIndex === idx
                      ? "border-emerald-500 scale-105 shadow-lg ring-2 ring-emerald-500/40"
                      : "border-transparent opacity-60 hover:opacity-100 hover:border-zinc-600"
                  }`}
                  aria-label={`Thumbnail ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover object-center"
                    referrerPolicy="no-referrer"
                    onError={(e) => handleProductImageError(e, img)}
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-black/85 text-[9px] text-emerald-400 font-mono text-center truncate px-0.5 font-bold">
                    {imageCodes[idx]?.code || `#${idx + 1}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
