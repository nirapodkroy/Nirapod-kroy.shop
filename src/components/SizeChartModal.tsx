import React from "react";
import { SizeChart } from "../types";
import { X, Ruler, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle?: string;
  sizeChart?: SizeChart;
  selectedSize?: string;
  onSelectSize?: (size: string) => void;
}

export const SizeChartModal: React.FC<SizeChartModalProps> = ({
  isOpen,
  onClose,
  productTitle,
  sizeChart,
  selectedSize,
  onSelectSize
}) => {
  if (!isOpen || !sizeChart || !sizeChart.columns || sizeChart.columns.length === 0) {
    return null;
  }

  const columns = sizeChart.columns;
  const rows = sizeChart.rows || [];
  const unit = sizeChart.unit || "ইঞ্চি (Inches)";
  const note = sizeChart.note || "* সকল পরিমাপ প্রস্তুতকারক নির্দেশিকা অনুযায়ী প্রদান করা হয়েছে। ১/২ ইঞ্চি পর্যন্ত প্লাস-মাইনাস হতে পারে।";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[90dvh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Ruler className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center gap-2">
                  <span>সাইজ চার্ট ও পরিমাপ গাইড</span>
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono">
                    {unit}
                  </span>
                </h3>
                {productTitle && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-sm sm:max-w-md mt-0.5">
                    {productTitle}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Close size guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Table Container */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 font-bold border-b border-zinc-200 dark:border-zinc-700">
                    <th className="p-3 sm:p-3.5 sticky left-0 bg-zinc-100 dark:bg-zinc-800/90 z-10 border-r border-zinc-200 dark:border-zinc-700 min-w-[120px]">
                      পরিমাপ / মাপ
                    </th>
                    {columns.map((col) => {
                      const isColSelected = selectedSize === col;
                      return (
                        <th
                          key={col}
                          onClick={() => onSelectSize && onSelectSize(col)}
                          className={`p-3 sm:p-3.5 text-center min-w-[70px] transition-colors cursor-pointer ${
                            isColSelected
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-black border-x-2 border-emerald-500"
                              : "hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60"
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <span className="text-xs sm:text-sm">{col}</span>
                            {isColSelected && (
                              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1 rounded">
                                নির্বাচিত
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {rows.map((row, idx) => {
                    const isEven = idx % 2 === 0;
                    return (
                      <tr
                        key={idx}
                        className={`${
                          isEven
                            ? "bg-white dark:bg-zinc-900"
                            : "bg-zinc-50/60 dark:bg-zinc-800/30"
                        } hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-colors`}
                      >
                        <td className="p-3 sm:p-3.5 font-semibold text-zinc-900 dark:text-zinc-200 sticky left-0 bg-inherit z-10 border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap">
                          {row.name}
                        </td>
                        {columns.map((col) => {
                          const val = row.values[col] || "-";
                          const isColSelected = selectedSize === col;
                          return (
                            <td
                              key={col}
                              onClick={() => onSelectSize && onSelectSize(col)}
                              className={`p-3 sm:p-3.5 text-center font-medium transition-colors cursor-pointer ${
                                isColSelected
                                  ? "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-bold border-x-2 border-emerald-500/80"
                                  : "text-zinc-700 dark:text-zinc-300"
                              }`}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Explanatory note */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              <p>{note}</p>
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                💡 টিপস: টেবিলের যেকোনো সাইজের কলামে ক্লিক করে সরাসরি সাইজ নির্বাচন করতে পারেন।
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {selectedSize ? (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>বর্তমানে নির্বাচিত সাইজ: <strong>{selectedSize}</strong></span>
                </span>
              ) : (
                <span>যেকোনো একটি সাইজ নির্বাচন করুন</span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              ঠিক আছে (Done)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
