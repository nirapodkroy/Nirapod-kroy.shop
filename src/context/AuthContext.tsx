import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CustomerUser } from "../types";
import { useToast } from "./ToastContext";

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
      const saved = localStorage.getItem("auracart_customer");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [customerToken, setCustomerToken] = useState<string | null>(() => {
    return localStorage.getItem("auracart_customer_token");
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"signin" | "signup">("signin");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Secret Admin state
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return sessionStorage.getItem("auracart_admin_token");
  });

  // Secret keyboard shortcut listener: Ctrl/Cmd + Alt/Option + Shift + T (Windows & Mac friendly)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isControlOrCmd = e.ctrlKey || e.metaKey;
      if (isControlOrCmd && e.altKey && e.shiftKey && (e.key === "T" || e.key === "t")) {
        e.preventDefault();
        setIsAdminModalOpen(prev => !prev);
        addToast("Secret Admin Console Activated", "info");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
      localStorage.setItem("auracart_customer", JSON.stringify(data.user));
      localStorage.setItem("auracart_customer_token", data.token);
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
      localStorage.setItem("auracart_customer", JSON.stringify(data.user));
      localStorage.setItem("auracart_customer_token", data.token);
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
    localStorage.removeItem("auracart_customer");
    localStorage.removeItem("auracart_customer_token");
    setIsProfileModalOpen(false);
    addToast("Logged out successfully", "info");
  }, [addToast]);

  const loginAdmin = async (password: string, email: string = "mtarifprodhan@gmail.com"): Promise<boolean> => {
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
      sessionStorage.setItem("auracart_admin_token", data.token);
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
    sessionStorage.removeItem("auracart_admin_token");
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
