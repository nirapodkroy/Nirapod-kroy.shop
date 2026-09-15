import React, { createContext, useContext, useEffect, useState } from "react";
import { Theme } from "../types";
import { safeGetLocalStorage, safeSetLocalStorage } from "../utils/storage";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      // Check if user manually saved their preferred theme
      const isManual = safeGetLocalStorage("auracart_theme_manual");
      if (isManual === "true") {
        const saved = safeGetLocalStorage("auracart_theme") as Theme;
        if (saved === "light" || saved === "dark") return saved;
      }
    } catch {}
    // Strictly default to "light" (pure clean white background)
    return "light";
  });

  useEffect(() => {
    try {
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => {
      const nextTheme = prev === "dark" ? "light" : "dark";
      safeSetLocalStorage("auracart_theme", nextTheme);
      safeSetLocalStorage("auracart_theme_manual", "true");
      return nextTheme;
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    safeSetLocalStorage("auracart_theme", newTheme);
    safeSetLocalStorage("auracart_theme_manual", "true");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
