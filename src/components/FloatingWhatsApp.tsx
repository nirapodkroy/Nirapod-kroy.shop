import React, { useState } from "react";
import { MessageCircle, X } from "lucide-react";

export const FloatingWhatsApp: React.FC = () => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(true);

  // WhatsApp and Helpline configured from store
  const helplineNumber = "01786681134";
  const whatsappNumber = "8801786681134";
  const defaultMessage = encodeURIComponent(
    "Hello Nirapod Kroy Support! আমি আপনাদের অনলাইন স্টোর থেকে অর্ডার / পণ্য সম্পর্কিত সহায়তা চাচ্ছি।"
  );
  // Support universal WhatsApp link with 01786681134
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${defaultMessage}`;

  return (
    <div className="fixed bottom-20 right-3.5 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2 pointer-events-auto transition-all duration-200">
      {/* Floating Announcement Bubble */}
      {isTooltipOpen && (
        <div className="relative flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-1.5 sm:py-2 px-2.5 sm:px-3 shadow-xl text-[11px] sm:text-xs max-w-[260px] sm:max-w-xs animate-bounce animate-once">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-zinc-700 dark:text-zinc-300 font-medium leading-tight">
            সাহায্য লাগবে? কল/WhatsApp: <strong>{helplineNumber}</strong>
          </span>
          <button
            onClick={() => setIsTooltipOpen(false)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main WhatsApp Floating Action Button */}
      <a
        id="whatsapp-floating-btn"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2 sm:gap-2.5 px-3 py-2.5 sm:px-4 sm:py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        title="Chat with Support on WhatsApp: 01786681134"
        aria-label="Chat with Us on WhatsApp"
      >
        <MessageCircle className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-current" />
        <span className="font-bold text-[11px] sm:text-xs tracking-wide flex flex-col items-start leading-tight">
          <span>WhatsApp Chat</span>
          <span className="text-[9px] sm:text-[10px] text-white/90 font-medium">{helplineNumber}</span>
        </span>
      </a>
    </div>
  );
};
