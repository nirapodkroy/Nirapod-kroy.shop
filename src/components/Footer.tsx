import React, { useState } from "react";
import { Sparkles, ShieldCheck, Heart, CreditCard, Send, CheckCircle2, Lock } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

interface FooterProps {
  onCategorySelect: (cat: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onCategorySelect }) => {
  const { language, t, getCategoryName } = useLanguage();
  const { setIsAdminModalOpen } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes("@")) return;
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setEmailInput("");
    }, 4000);
  };

  return (
    <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 transition-colors duration-200">
      {/* Newsletter / Value Bar */}
      <div className="border-b border-zinc-200/80 dark:border-zinc-800/80 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                {language === "bn" ? "নিরাপদ কেনাকাটা" : "Safe Shopping"}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white font-display mt-0.5">
                {t("newsletter_heading")}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {t("newsletter_desc")}
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="w-full md:w-auto flex items-center gap-2">
              <input
                id="footer-email-input"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder={t("email_placeholder")}
                required
                className="w-full sm:w-72 px-4 py-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                id="footer-subscribe-btn"
                type="submit"
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                {subscribed ? (
                  <>
                    <span>{language === "bn" ? "ধন্যবাদ!" : "Subscribed!"}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </>
                ) : (
                  <>
                    <span>{t("subscribe_btn")}</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-xl text-zinc-900 dark:text-white">
                {language === "bn" ? "নিরাপদ ক্রয়" : "Nirapod Kroy"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed max-w-sm">
              {t("footer_about")}
            </p>
            <div className="mt-4 flex items-center gap-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {t("ssl_secure")}
              </span>
              <span>•</span>
              <span>{t("authentic_products")}</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 mb-3">
              {t("categories_heading")}
            </h4>
            <ul className="space-y-2 text-xs">
              {["Groceries", "Electronics", "Fashion", "Health & Beauty", "Home & Kitchen", "Baby & Kids", "Sports", "Books"].map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => onCategorySelect(cat)}
                    className="hover:text-emerald-500 transition-colors text-left"
                  >
                    {getCategoryName(cat)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 mb-3">
              {t("customer_care_heading")}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#catalog-section" className="hover:text-emerald-500 transition-colors">
                  {t("order_tracking")}
                </a>
              </li>
              <li>
                <a href="#catalog-section" className="hover:text-emerald-500 transition-colors">
                  {t("delivery_policy")}
                </a>
              </li>
              <li>
                <a href="#catalog-section" className="hover:text-emerald-500 transition-colors">
                  {t("refund_policy")}
                </a>
              </li>
              <li>
                <a href="#catalog-section" className="hover:text-emerald-500 transition-colors">
                  {t("privacy_policy")}
                </a>
              </li>
            </ul>
          </div>

          {/* Social Handles & Contact */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 mb-3">
              {t("contact_heading")}
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  id="footer-facebook-link"
                  href="https://facebook.com/nirapodkroy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-500 transition-colors flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300"
                >
                  <span className="w-5 h-5 rounded-md bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-[11px]">f</span>
                  <span>Facebook (@nirapodkroy)</span>
                </a>
              </li>
              <li>
                <a
                  id="footer-instagram-link"
                  href="https://instagram.com/nirapodkroy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-500 transition-colors flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300"
                >
                  <span className="w-5 h-5 rounded-md bg-pink-600/10 text-pink-600 flex items-center justify-center font-bold text-[11px]">ig</span>
                  <span>Instagram (@nirapodkroy)</span>
                </a>
              </li>
              <li>
                <a
                  id="footer-whatsapp-link"
                  href="https://wa.me/expttarif"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5"
                >
                  <span className="w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[11px]">wa</span>
                  <span>WhatsApp (@expttarif)</span>
                </a>
              </li>
              <li className="pt-1 text-zinc-500 dark:text-zinc-400">
                <a
                  id="footer-email-link"
                  href="mailto:support@nirapodkroy.shop"
                  className="font-mono text-[11px] hover:text-emerald-500 text-zinc-600 dark:text-zinc-300 transition-colors"
                >
                  support@nirapodkroy.shop
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Payment Methods */}
        <div className="mt-12 pt-6 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-zinc-400 text-center sm:text-left">
            <span>
              © {new Date().getFullYear()} Nirapod Kroy (নিরাপদ ক্রয়) — {t("copyright")}
            </span>
            {/* Discreet Admin Launcher for Phone & Tablet touch users without keyboard */}
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="p-1 text-zinc-300 dark:text-zinc-700 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors cursor-pointer rounded"
              title="Admin Portal (or press Ctrl+Alt+Shift+T)"
              aria-label="Admin Portal"
            >
              <Lock className="w-3 h-3 opacity-60 hover:opacity-100" />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-[11px] text-zinc-400 mr-1">{language === "bn" ? "পেমেন্ট মাধ্যম:" : "Accepted Payments:"}</span>
            <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[10px] font-bold">
              bKash
            </span>
            <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[10px] font-bold">
              Nagad
            </span>
            <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[10px] font-bold">
              Rocket
            </span>
            <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[10px] font-bold">
              Cash on Delivery
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

