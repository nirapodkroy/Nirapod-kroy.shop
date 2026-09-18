import React, { useState } from "react";
import { Copy, Check, ShieldCheck } from "lucide-react";

export type MobileBankingProvider = "bKash" | "Nagad" | "Rocket";

interface MobileBankingGatewayProps {
  selectedProvider: MobileBankingProvider;
  onSelectProvider: (provider: MobileBankingProvider) => void;
  senderPhone: string;
  onChangeSenderPhone: (val: string) => void;
  transactionId: string;
  onChangeTransactionId: (val: string) => void;
  finalTotal: number;
  orderPreviewId: string;
  feePercent?: number; // 1.2%
}

export const MobileBankingGateway: React.FC<MobileBankingGatewayProps> = ({
  selectedProvider,
  onSelectProvider,
  senderPhone,
  onChangeSenderPhone,
  transactionId,
  onChangeTransactionId,
  finalTotal,
  orderPreviewId,
  feePercent = 1.2
}) => {
  const [copied, setCopied] = useState(false);

  // Exact recipient mobile number requested: 01786681134
  const phoneNumber = "01786681134";

  const handleCopy = () => {
    navigator.clipboard.writeText(phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Provider metadata matching user's reference screenshots
  const providerMeta = {
    bKash: {
      name: "bKash",
      label: "বিকাশ",
      ussd: "*247#",
      bgGradient: "bg-[#D12053]", // Exact bKash pink from Image 1
      brandColor: "#D12053",
      accentBg: "bg-pink-50 dark:bg-pink-950/30",
      accentBorder: "border-[#D12053]",
      textColor: "text-[#D12053]"
    },
    Nagad: {
      name: "Nagad",
      label: "নগদ",
      ussd: "*167#",
      bgGradient: "bg-[#D62828]", // Exact Nagad red from Image 2
      brandColor: "#D62828",
      accentBg: "bg-red-50 dark:bg-red-950/30",
      accentBorder: "border-[#D62828]",
      textColor: "text-[#D62828]"
    },
    Rocket: {
      name: "Rocket",
      label: "রকেট",
      ussd: "*322#",
      bgGradient: "bg-[#7E22CE]", // Exact Rocket purple from Image 3
      brandColor: "#7E22CE",
      accentBg: "bg-purple-50 dark:bg-purple-950/30",
      accentBorder: "border-[#7E22CE]",
      textColor: "text-[#7E22CE]"
    }
  };

  const current = providerMeta[selectedProvider];

  return (
    <div className="space-y-3.5 pt-1">
      {/* 1. MFS Category Header Bar & Selector (as shown in Image 5) */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700/80 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
        {/* Top category blue strip */}
        <div className="bg-[#0052cc] px-4 py-2.5 flex items-center justify-between text-white font-semibold text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>মোবাইল ব্যাংকিং (Mobile Banking)</span>
          </div>
          <span className="text-[11px] font-normal text-blue-100 bg-white/10 px-2 py-0.5 rounded-full">
            ১.২% গেটওয়ে ফি প্রযোজ্য
          </span>
        </div>

        {/* 3 Provider Grid Cards (Image 5 style) */}
        <div className="p-3 grid grid-cols-3 gap-2.5 bg-zinc-50/70 dark:bg-zinc-900/60">
          {/* bKash Card */}
          <button
            type="button"
            onClick={() => onSelectProvider("bKash")}
            className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer bg-white dark:bg-zinc-800 ${
              selectedProvider === "bKash"
                ? "border-[#D12053] shadow-md shadow-[#D12053]/15 scale-[1.02]"
                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 opacity-80 hover:opacity-100"
            }`}
          >
            {selectedProvider === "bKash" && (
              <span className="absolute -top-2 right-2 bg-[#D12053] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                ✓
              </span>
            )}
            <div className="h-9 flex items-center justify-center">
              <svg className="h-7 w-auto" viewBox="0 0 160 56" fill="none">
                {/* bKash Origami bird */}
                <path d="M125 6 L148 24 L132 30 Z" fill="#E2136E" />
                <path d="M148 24 L160 14 L142 6 Z" fill="#D12053" />
                <path d="M132 30 L146 50 L118 36 Z" fill="#C2185B" />
                <path d="M118 36 L110 20 L125 6 Z" fill="#E2136E" />
                <text x="5" y="38" fill="#E2136E" fontSize="34" fontWeight="800" fontFamily="sans-serif">bKash</text>
              </svg>
            </div>
            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mt-1">বিকাশ</span>
          </button>

          {/* Nagad Card */}
          <button
            type="button"
            onClick={() => onSelectProvider("Nagad")}
            className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer bg-white dark:bg-zinc-800 ${
              selectedProvider === "Nagad"
                ? "border-[#D62828] shadow-md shadow-[#D62828]/15 scale-[1.02]"
                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 opacity-80 hover:opacity-100"
            }`}
          >
            {selectedProvider === "Nagad" && (
              <span className="absolute -top-2 right-2 bg-[#D62828] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                ✓
              </span>
            )}
            <div className="h-9 flex items-center justify-center">
              <svg className="h-7 w-auto" viewBox="0 0 160 56" fill="none">
                {/* Nagad swirl */}
                <circle cx="135" cy="28" r="18" fill="#F33E3E" opacity="0.15" />
                <path d="M135 12 C145 12, 150 20, 145 28 C140 36, 125 32, 130 22 C133 16, 140 18, 138 24" stroke="#F33E3E" strokeWidth="4" strokeLinecap="round" fill="none" />
                <circle cx="135" cy="24" r="3.5" fill="#F37021" />
                <text x="8" y="38" fill="#D62828" fontSize="32" fontWeight="800" fontFamily="sans-serif">নগদ</text>
              </svg>
            </div>
            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mt-1">নগদ</span>
          </button>

          {/* Rocket Card */}
          <button
            type="button"
            onClick={() => onSelectProvider("Rocket")}
            className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer bg-white dark:bg-zinc-800 ${
              selectedProvider === "Rocket"
                ? "border-[#7E22CE] shadow-md shadow-[#7E22CE]/15 scale-[1.02]"
                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 opacity-80 hover:opacity-100"
            }`}
          >
            {selectedProvider === "Rocket" && (
              <span className="absolute -top-2 right-2 bg-[#7E22CE] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                ✓
              </span>
            )}
            <div className="h-9 flex items-center justify-center">
              <svg className="h-7 w-auto" viewBox="0 0 160 56" fill="none">
                {/* Rocket plane */}
                <path d="M115 42 L132 10 L152 26 L128 32 L122 42 Z" fill="#8C1D82" />
                <path d="M128 32 L132 10 L122 42 Z" fill="#6B21A8" />
                <text x="6" y="38" fill="#7E22CE" fontSize="30" fontWeight="800" fontFamily="sans-serif">রকেট</text>
              </svg>
            </div>
            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mt-1">রকেট</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary White Box (Exact match with Image 1, 2, 3) */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 font-black text-xl">
            S
          </div>
          <div className="min-w-0">
            <h4 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white truncate">
              Nirapod Kroy
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              ইনভয়েস আইডি: <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">#{orderPreviewId}</span>
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white font-display">
            ৳ {finalTotal}
          </div>
          <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/50 mt-0.5">
            {feePercent.toFixed(2)}% ফি যুক্ত হয়েছে
          </div>
        </div>
      </div>

      {/* 3. Themed Color Container (Exact replica of Image 1, 2, 3) */}
      <div className={`rounded-2xl ${current.bgGradient} text-white p-4 sm:p-5 shadow-lg space-y-4`}>
        {/* Title */}
        <div className="text-center space-y-1">
          <h3 className="text-base sm:text-lg font-extrabold tracking-wide text-white">
            পেমেন্ট তথ্য দিন (Payment Information)
          </h3>
          <p className="text-[11px] text-white/90">
            যে নম্বর থেকে টাকা পাঠিয়েছেন এবং ট্রানজেকশন আইডি দিন
          </p>
        </div>

        {/* Inputs Grid: Sender Phone & Transaction ID */}
        <div className="space-y-2.5">
          {/* Sender Phone Number Input */}
          <div>
            <label className="block text-xs font-bold text-white mb-1">
              যে নম্বর থেকে টাকা পাঠিয়েছেন (Sender Number): <span className="text-yellow-300">*</span>
            </label>
            <input
              type="tel"
              required
              value={senderPhone}
              onChange={(e) => onChangeSenderPhone(e.target.value)}
              placeholder="যেমন: 017XXXXXXXX বা 019XXXXXXXX"
              className="w-full px-4 py-2.5 bg-white text-zinc-900 font-mono text-sm sm:text-base rounded-xl border-2 border-white/60 focus:outline-none focus:ring-4 focus:ring-white/30 placeholder:text-zinc-400 shadow-inner text-center font-bold tracking-wider"
            />
          </div>

          {/* Transaction ID Input Box */}
          <div>
            <label className="block text-xs font-bold text-white mb-1">
              ট্রানজেকশন আইডি (Transaction ID / TrxID): <span className="text-yellow-300">*</span>
            </label>
            <input
              type="text"
              required
              value={transactionId}
              onChange={(e) => onChangeTransactionId(e.target.value.toUpperCase())}
              placeholder="ট্রানজেকশন আইডি দিন (যেমন: 9K28X9LA)"
              className="w-full px-4 py-2.5 bg-white text-zinc-900 font-mono text-sm sm:text-base rounded-xl border-2 border-white/60 focus:outline-none focus:ring-4 focus:ring-white/30 placeholder:text-zinc-400 shadow-inner text-center font-bold tracking-wider"
            />
          </div>
        </div>

        {/* Step-by-Step Instructions (Exact wording from screenshots) */}
        <div className="space-y-2.5 text-xs sm:text-[13px] text-white/95 leading-relaxed pt-1">
          <div className="flex items-start gap-2">
            <span className="font-black text-white text-sm shrink-0">•</span>
            <span>
              <strong>{current.ussd}</strong> ডায়াল করে আপনার <strong>{current.name}</strong> মোবাইল মেনুতে যান অথবা <strong>{current.name}</strong> অ্যাপে যান।
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="font-black text-white text-sm shrink-0">•</span>
            <span>
              <strong>&ldquo;Send Money&rdquo;</strong> -এ ক্লিক করুন।
            </span>
          </div>

          <div className="flex items-start gap-2 flex-wrap sm:flex-nowrap">
            <span className="font-black text-white text-sm shrink-0">•</span>
            <div className="flex-1 flex items-center gap-2 flex-wrap">
              <span>প্রাপক নম্বর হিসেবে এই নম্বরটি লিখুন:</span>
              <span className="font-mono font-black text-sm sm:text-base bg-white/20 px-2.5 py-0.5 rounded-lg text-yellow-200 tracking-wider">
                {phoneNumber}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md bg-white text-zinc-900 hover:bg-zinc-100 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>কপি হয়েছে</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="font-black text-white text-sm shrink-0">•</span>
            <span>
              টাকার পরিমাণ: <strong className="text-yellow-200 text-sm font-mono">{finalTotal}</strong>
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="font-black text-white text-sm shrink-0">•</span>
            <span>
              নিশ্চিত করতে এখন আপনার <strong>{current.name}</strong> মোবাইল মেনু পিন লিখুন।
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="font-black text-white text-sm shrink-0">•</span>
            <span>
              সবকিছু ঠিক থাকলে, আপনি <strong>{current.name}</strong> থেকে একটি নিশ্চিতকরণ বার্তা পাবেন।
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="font-black text-white text-sm shrink-0">•</span>
            <span>
              এখন উপরের বক্সে আপনার <strong>Transaction ID</strong> দিন এবং নিচের <strong>VERIFY / অর্ডার নিশ্চিত করুন</strong> বাটনে ক্লিক করুন।
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
