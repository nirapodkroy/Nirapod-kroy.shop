import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CustomerUser } from "../types";
import { useToast } from "./ToastContext";
import {
  safeGetLocalStorage,
  safeSetLocalStorage,
  safeRemoveLocalStorage,
  safeGetSessionStorage,
  safeSetSessionStorage
} from "../utils/storage";

interface AuthContextType {
  currentUser: CustomerUser | null;
  customerToken: string | null;
  loginCustomer: (email: string, password: string) => Promise<boolean>;
  registerCustomer: (name: string, email: string, password: string, phone?: string, address?: string) => Promise<boolean>;
  logoutCustomer: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalTab: "signin" | "signup";
  setAuthModalTab: (tab: "signin" | "signup") => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  // Secret Admin
  isAdminModalOpen: boolean;
  setIsAdminModalOpen: (open: boolean) => void;
  isAdminLoggedIn: boolean;
  adminToken: string | null;
  loginAdmin: (password: string, email?: string) => Promise<boolean>;
  logoutAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast();

  // Customer state
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(() => {
    try {
      const saved = safeGetLocalStorage("auracart_customer");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [customerToken, setCustomerToken] = useState<string | null>(() => {
    return safeGetLocalStorage("auracart_customer_token");
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"signin" | "signup">("signin");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Secret Admin state
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return safeGetSessionStorage("auracart_admin_token") || safeGetLocalStorage("auracart_admin_token");
  });

  // Admin keyboard shortcut listener:
  // Supports:
  // 1. Ctrl/Cmd + Alt + Shift + T (original)
  // 2. Ctrl/Cmd + Alt + T (easier 3-key combo, avoids Chrome 'reopen tab' collision)
  // 3. Ctrl/Cmd + Shift + A or Ctrl/Cmd + Alt + A (A for Admin)
  // Works with English, Bengali (Avro/Bijoy), and physical keycodes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;
      const isShift = e.shiftKey;

      const code = e.code;
      const key = e.key ? e.key.toLowerCase() : "";
      const keyCode = e.keyCode || e.which;

      const isT = code === "KeyT" || keyCode === 84 || key === "t" || key === "ট" || key === "ত";
      const isA = code === "KeyA" || keyCode === 65 || key === "a" || key === "অ" || key === "া";

      // Match either:
      // (Ctrl+Alt+Shift + T) OR (Ctrl+Alt + T) OR (Ctrl+Shift + A) OR (Ctrl+Alt + A)
      const matchesOriginal = isCtrlOrCmd && isAlt && isShift && isT;
      const matchesCtrlAltT = isCtrlOrCmd && isAlt && isT;
      const matchesAdminA = isCtrlOrCmd && (isShift || isAlt) && isA;

      if (matchesOriginal || matchesCtrlAltT || matchesAdminA) {
        e.preventDefault();
        e.stopPropagation();
        setIsAdminModalOpen(prev => !prev);
        addToast("অ্যাডমিন প্যানেল সক্রিয় হয়েছে (Admin Console Activated)", "info");
      }
    };

    // Use capture phase so browser or nested elements don't drop the event
    window.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [addToast]);

  const loginCustomer = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Login failed", "error");
        return false;
      }

      setCurrentUser(data.user);
      setCustomerToken(data.token);
      safeSetLocalStorage("auracart_customer", JSON.stringify(data.user));
      safeSetLocalStorage("auracart_customer_token", data.token);
      addToast(`Welcome back, ${data.user.name}!`, "success");
      setIsAuthModalOpen(false);
      return true;
    } catch (err) {
      console.error("Login error:", err);
      addToast("Network error. Please try again.", "error");
      return false;
    }
  };

  const registerCustomer = async (
    name: string,
    email: string,
    password: string,
    phone?: string,
    address?: string
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone, address })
      });

      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Registration failed", "error");
        return false;
      }

      setCurrentUser(data.user);
      setCustomerToken(data.token);
      safeSetLocalStorage("auracart_customer", JSON.stringify(data.user));
      safeSetLocalStorage("auracart_customer_token", data.token);
      addToast(`Account created! Welcome, ${data.user.name}`, "success");
      setIsAuthModalOpen(false);
      return true;
    } catch (err) {
      console.error("Register error:", err);
      addToast("Network error. Please try again.", "error");
      return false;
    }
  };

  const logoutCustomer = useCallback(() => {
    setCurrentUser(null);
    setCustomerToken(null);
    safeRemoveLocalStorage("auracart_customer");
    safeRemoveLocalStorage("auracart_customer_token");
    setIsProfileModalOpen(false);
    addToast("Logged out successfully", "info");
  }, [addToast]);

  const loginAdmin = async (password: string, email: string = ""): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Admin authentication failed", "error");
        return false;
      }

      setAdminToken(data.token);
      safeSetSessionStorage("auracart_admin_token", data.token);
      safeSetLocalStorage("auracart_admin_token", data.token);
      addToast("Admin console authenticated successfully", "success");
      return true;
    } catch (err) {
      console.error("Admin login error:", err);
      addToast("Admin login failed. Please try again.", "error");
      return false;
    }
  };

  const logoutAdmin = useCallback(() => {
    setAdminToken(null);
    try {
      sessionStorage.removeItem("auracart_admin_token");
    } catch {}
    safeRemoveLocalStorage("auracart_admin_token");
    setIsAdminModalOpen(false);
    addToast("Admin logged out", "info");
  }, [addToast]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        customerToken,
        loginCustomer,
        registerCustomer,
        logoutCustomer,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        isProfileModalOpen,
        setIsProfileModalOpen,
        isAdminModalOpen,
        setIsAdminModalOpen,
        isAdminLoggedIn: Boolean(adminToken),
        adminToken,
        loginAdmin,
        logoutAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
