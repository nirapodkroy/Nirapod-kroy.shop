import React from "react";
import { Ruler } from "lucide-react";
import { SizeChart } from "../types";

interface SizeSelectorProps {
  sizes?: string[];
  sizeChart?: SizeChart;
  selectedSize?: string;
  onSelectSize: (size: string) => void;
  onOpenSizeChart?: () => void;
  className?: string;
  variant?: "detail" | "compact";
}

export const SizeSelector: React.FC<SizeSelectorProps> = ({
  sizes,
  sizeChart,
  selectedSize,
  onSelectSize,
  onOpenSizeChart,
  className = "",
  variant = "detail"
}) => {
  if (!sizes || sizes.length === 0) return null;

  const hasChart = !!sizeChart && sizeChart.columns && sizeChart.columns.length > 0;

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Top Label with Size Chart Link */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
          <span>সাইজ:</span>
          {selectedSize ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/20 text-xs">
              {selectedSize}
            </span>
          ) : (
            <span className="text-[11px] font-normal text-zinc-400">
              (যেকোনো একটি সাইজ বেছে নিন)
            </span>
          )}
        </label>

        {hasChart && onOpenSizeChart && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenSizeChart();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>📏 সাইজ চার্ট দেখুন</span>
          </button>
        )}
      </div>

      {/* Radio-style pill selection matching user prompt and screenshot */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {sizes.map((sz) => {
          const isSelected = selectedSize === sz;
          return (
            <button
              key={sz}
              type="button"
              id={`size-opt-${sz}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectSize(sz);
              }}
              className={`group relative flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer border ${
                isSelected
                  ? "bg-emerald-500/10 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs ring-2 ring-emerald-500/20"
                  : "bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-750"
              }`}
            >
              {/* Radio circle matching screenshot: ( ) 38 ( ) 40 */}
              <span
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                  isSelected
                    ? "border-emerald-600 dark:border-emerald-400 bg-emerald-600 dark:bg-emerald-400"
                    : "border-zinc-400 dark:border-zinc-500 group-hover:border-zinc-600 dark:group-hover:border-zinc-300"
                }`}
              >
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                )}
              </span>

              {/* Size text */}
              <span className="tracking-wide">{sz}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
