import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { X, Mail, Lock, User, Phone, MapPin, ArrowRight, ShieldCheck, AlertCircle, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const CustomerAuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    loginCustomer,
    loginWithGoogle,
    loginWithGoogleEmail,
    registerCustomer
  } = useAuth();
  const { language, t } = useLanguage();

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpAddress, setSignUpAddress] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [googleInputEmail, setGoogleInputEmail] = useState("");

  if (!isAuthModalOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await loginCustomer(signInEmail, signInPassword);
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await registerCustomer(signUpName, signUpEmail, signUpPassword, signUpPhone, signUpAddress);
    setIsLoading(false);
  };

  const fillDemoAccount = () => {
    setSignInEmail("mtarifprodhan@gmail.com");
    setSignInPassword("user12345");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsAuthModalOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden z-10 my-auto max-h-[92dvh] flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close auth modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header & Tabs */}
          <div className="p-5 sm:p-8 pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-white shadow-sm border border-emerald-100 dark:border-emerald-900/40 shrink-0">
                  <img
                    src="/logo.png"
                    alt="Nirapod Kroy Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src.endsWith(".png")) {
                        target.src = "/logo.svg";
                      }
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 font-extrabold text-sm tracking-tight font-display">
                    <span className="text-[#1e9454] dark:text-[#34d399]">
                      {language === "bn" ? "নিরাপদ" : "NIRAPOD"}
                    </span>
                    <span className="text-[#d38f18] dark:text-[#fbbf24]">
                      {language === "bn" ? "ক্রয়" : "KROY"}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {language === "bn" ? "কাস্টমার পোর্টাল" : "Customer Portal"}
                  </span>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 font-display">
              {authModalTab === "signin"
                ? (language === "bn" ? "স্বাগতম! সাইন ইন করুন" : "Welcome Back")
                : (language === "bn" ? "নতুন অ্যাকাউন্ট তৈরি করুন" : "Create an Account")}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {authModalTab === "signin"
                ? (language === "bn"
                    ? "আপনার ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করে পূর্বের অর্ডার ট্র্যাক করুন।"
                    : "Sign in with your email and password to track orders and save your address.")
                : (language === "bn"
                    ? "সহজে ও দ্রুত অর্ডার করতে প্রয়োজনীয় তথ্য দিয়ে নিবন্ধন করুন।"
                    : "Register with your details for personalized orders and express checkout.")}
            </p>

            {/* Tab switchers */}
            <div className="mt-5 grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              <button
                type="button"
                onClick={() => setAuthModalTab("signin")}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authModalTab === "signin"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {t("sign_in")}
              </button>
              <button
                type="button"
                onClick={() => setAuthModalTab("signup")}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authModalTab === "signup"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {t("register")}
              </button>
            </div>

            {/* Google Sign In Button */}
            <div className="mt-4">
              <button
                type="button"
                disabled={isGoogleLoading || isLoading}
                onClick={async () => {
                  setIsGoogleLoading(true);
                  const candidateEmail = signInEmail.trim() || signUpEmail.trim() || "Muhammadtarif018@gmail.com";
                  const success = await loginWithGoogle(candidateEmail);
                  if (!success) {
                    setShowGooglePrompt(true);
                    setGoogleInputEmail(candidateEmail);
                  }
                  setIsGoogleLoading(false);
                }}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.28-2.1 3.66-5.2 3.66-9.12z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.36 7.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>
                  {isGoogleLoading
                    ? (language === "bn" ? "Google সাইন ইন হচ্ছে..." : "Signing in with Google...")
                    : (language === "bn" ? "Google দিয়ে সাইন ইন করুন" : "Continue with Google")}
                </span>
              </button>

              {/* Direct Instant Google Login Prompt if popup is blocked by domain */}
              {showGooglePrompt && (
                <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-zinc-800 dark:to-zinc-800 border-2 border-orange-500 shadow-xl space-y-2.5 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.28-2.1 3.66-5.2 3.66-9.12z" />
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.36 7.36 24 12 24z" />
                        <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z" />
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z" />
                      </svg>
                      <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100">
                        {language === "bn" ? "Google অ্যাকাউন্ট দিয়ে সরাসরি সাইন ইন" : "Direct Google Sign-In"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGooglePrompt(false)}
                      className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-[11px] leading-tight text-zinc-700 dark:text-zinc-300 font-medium">
                    {language === "bn"
                      ? "আপনার Google / জিমেইল ঠিকানা দিয়ে সরাসরি ১-ক্লিকে লগইন করুন:"
                      : "Enter your Google / Gmail address to sign in instantly:"}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={googleInputEmail}
                      onChange={(e) => setGoogleInputEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="flex-1 px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-orange-400 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      disabled={!googleInputEmail || isGoogleLoading}
                      onClick={async () => {
                        setIsGoogleLoading(true);
                        await loginWithGoogleEmail(googleInputEmail);
                        setIsGoogleLoading(false);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {language === "bn" ? "লগইন করুন →" : "Sign In →"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative my-3 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <span className="relative bg-white dark:bg-zinc-900 px-3 text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                {language === "bn" ? "অথবা ইমেইল একাউন্ট" : "or with email"}
              </span>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-8 pt-4 overflow-y-auto">
            {authModalTab === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {t("email_address")}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="email"
                      required
                      placeholder="your.email@gmail.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === "bn" ? "পাসওয়ার্ড" : "Password"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    type="button"
                    onClick={fillDemoAccount}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
                  >
                    {language === "bn" ? "ডেমো অ্যাকাউন্ট ব্যবহার করুন" : "Use Sample Account"}
                  </button>
                  <span className="text-zinc-400 text-[11px]">{language === "bn" ? "এনক্রিপ্টেড সুরক্ষিত সেশন" : "Encrypted session"}</span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{t("sign_in")}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {t("full_name")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      required
                      placeholder={language === "bn" ? "যেমন: মোহাম্মদ তারিক" : "e.g. Tariq Prodhan"}
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {t("email_address")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="email"
                      required
                      placeholder="your.email@gmail.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === "bn" ? "পাসওয়ার্ড" : "Password"} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder={language === "bn" ? "কমপক্ষে ৬ ডিজিট" : "Minimum 6 characters"}
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("mobile_number")}
                    </label>
                    <input
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={signUpPhone}
                      onChange={(e) => setSignUpPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      {language === "bn" ? "শহর" : "Delivery City"}
                    </label>
                    <input
                      type="text"
                      placeholder={language === "bn" ? "ঢাকা" : "e.g. Dhaka"}
                      value={signUpAddress}
                      onChange={(e) => setSignUpAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{t("register")}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
              <div className="flex items-center gap-1.5 mx-auto">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>
                  {language === "bn"
                    ? "এনক্রিপ্টেড নিরাপদ সেশন"
                    : "Encrypted secure session"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

