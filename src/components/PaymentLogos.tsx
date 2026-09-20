import React, { useState } from "react";
import {
  BKASH_DATA_URI,
  NAGAD_DATA_URI,
  ROCKET_RAW_SVG
} from "./paymentAssetsData";

// Data URI for Rocket SVG (vector graphic encoded for 100% instant rendering)
export const ROCKET_DATA_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(ROCKET_RAW_SVG)}`;

// Robust payment logo paths with embedded Data URIs as primary and multiple web fallbacks
export const PAYMENT_ASSETS = {
  bKash: {
    name: "bKash",
    label: "বিকাশ",
    primarySrc: BKASH_DATA_URI,
    fallbackSrc: "/bkash.png",
    subpathSrc: "/assets/payment/bkash.png",
    svgSrc: "/bkash.svg",
    color: "#D12053",
    bgClass: "bg-[#D12053]",
    textClass: "text-[#D12053]",
    lightBg: "bg-pink-50 dark:bg-pink-950/30",
    borderClass: "border-[#D12053]/30"
  },
  Nagad: {
    name: "Nagad",
    label: "নগদ",
    primarySrc: NAGAD_DATA_URI,
    fallbackSrc: "/nagad.png",
    subpathSrc: "/assets/payment/nagad.png",
    svgSrc: "/nagad.svg",
    color: "#D62828",
    bgClass: "bg-[#D62828]",
    textClass: "text-[#D62828]",
    lightBg: "bg-red-50 dark:bg-red-950/30",
    borderClass: "border-[#D62828]/30"
  },
  Rocket: {
    name: "Rocket",
    label: "রকেট",
    primarySrc: ROCKET_DATA_URI,
    fallbackSrc: "/rocket.svg",
    subpathSrc: "/assets/payment/rocket.svg",
    svgSrc: "/rocket.svg",
    color: "#7E22CE",
    bgClass: "bg-[#7E22CE]",
    textClass: "text-[#7E22CE]",
    lightBg: "bg-purple-50 dark:bg-purple-950/30",
    borderClass: "border-[#7E22CE]/30"
  }
};

export type PaymentProviderType = "bKash" | "Nagad" | "Rocket";

interface PaymentLogoProps {
  provider: PaymentProviderType;
  className?: string;
  alt?: string;
  showTextFallback?: boolean;
}

export const PaymentLogo: React.FC<PaymentLogoProps> = ({
  provider,
  className = "h-6 w-auto object-contain",
  alt,
  showTextFallback = true
}) => {
  const meta = PAYMENT_ASSETS[provider] || PAYMENT_ASSETS.bKash;
  const [imgErrorStep, setImgErrorStep] = useState<number>(0);

  const handleError = () => {
    setImgErrorStep((prev) => prev + 1);
  };

  // Step 0: Primary embedded Data URI (100% resilient, 0ms, zero network calls)
  // Step 1: Physical root /provider.png or /provider.svg
  // Step 2: /assets/payment/ subpath
  // Step 3: Direct SVG path
  // Step 4: High-fidelity Vector Fallback
  if (imgErrorStep >= 4) {
    if (provider === "bKash") {
      return (
        <span className={`inline-flex items-center gap-1.5 font-bold px-2 py-0.5 rounded bg-[#D12053] text-white text-xs ${className}`}>
          <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 32 32">
            <polygon points="16,2 30,16 22,28 10,28 2,16" />
          </svg>
          {showTextFallback ? "bKash" : ""}
        </span>
      );
    }
    if (provider === "Nagad") {
      return (
        <span className={`inline-flex items-center gap-1.5 font-bold px-2 py-0.5 rounded bg-[#D62828] text-white text-xs ${className}`}>
          <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14" />
          </svg>
          {showTextFallback ? "নগদ" : ""}
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold px-2 py-0.5 rounded bg-[#7E22CE] text-white text-xs ${className}`}>
        <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 32 32">
          <polygon points="16,2 26,26 6,26" />
        </svg>
        {showTextFallback ? "রকেট" : ""}
      </span>
    );
  }

  const currentSrc =
    imgErrorStep === 0
      ? meta.primarySrc
      : imgErrorStep === 1
      ? meta.fallbackSrc
      : imgErrorStep === 2
      ? meta.subpathSrc
      : meta.svgSrc;

  return (
    <img
      src={currentSrc}
      alt={alt || meta.name}
      onError={handleError}
      loading="eager"
      decoding="async"
      className={className}
    />
  );
};

export const BkashLogo: React.FC<{ className?: string; alt?: string }> = (props) => (
  <PaymentLogo provider="bKash" {...props} />
);

export const NagadLogo: React.FC<{ className?: string; alt?: string }> = (props) => (
  <PaymentLogo provider="Nagad" {...props} />
);

export const RocketLogo: React.FC<{ className?: string; alt?: string }> = (props) => (
  <PaymentLogo provider="Rocket" {...props} />
);
