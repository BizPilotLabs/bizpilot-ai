import { useEffect, useMemo, useState, type PropsWithChildren, type ReactElement } from "react";

import { ThemeContext, type Theme, type ThemeContextValue } from "./theme-context";

const storageKey = "bizpilot-theme";

const applyTheme = (theme: Theme): void => {
  const root = window.document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldUseDark = theme === "dark" || (theme === "system" && prefersDark);

  root.classList.toggle("dark", shouldUseDark);
};

export const ThemeProvider = ({ children }: PropsWithChildren): ReactElement => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const storedTheme = window.localStorage.getItem(storageKey);
    return storedTheme === "dark" || storedTheme === "light" || storedTheme === "system" ? storedTheme : "system";
  });

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(storageKey, theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: setThemeState
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
