"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

type ThemeToggleProps = {
  label: string;
  modes: Record<ThemeMode, string>;
};

const storageKey = "funqa-theme";

function resolveInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(storageKey);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle({ label, modes }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const initialTheme = resolveInitialTheme();
    setTheme(initialTheme);
    document.body.dataset.theme = initialTheme;
  }, []);

  function switchTheme(nextTheme: ThemeMode) {
    setTheme(nextTheme);
    document.body.dataset.theme = nextTheme;
    window.localStorage.setItem(storageKey, nextTheme);
  }

  return (
    <div aria-label={label} className="theme-switcher" role="group">
      {(["light", "dark"] as const).map((item) => (
        <button
          aria-pressed={theme === item}
          className={theme === item ? "segment segment-active" : "segment"}
          key={item}
          onClick={() => switchTheme(item)}
          type="button"
        >
          {modes[item]}
        </button>
      ))}
    </div>
  );
}
