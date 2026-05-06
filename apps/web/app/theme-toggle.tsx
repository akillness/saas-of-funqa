"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@/components/menu-icons";

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
    <div aria-label={label} className="menu-control-group theme-switcher" role="group">
      <span className="menu-control-icon" aria-hidden="true">
        {theme === "dark" ? <MoonIcon /> : <SunIcon />}
      </span>
      {(["light", "dark"] as const).map((item) => (
        <button
          aria-pressed={theme === item}
          aria-label={modes[item]}
          className={theme === item ? "icon-segment icon-segment-active" : "icon-segment"}
          key={item}
          onClick={() => switchTheme(item)}
          title={modes[item]}
          type="button"
        >
          {item === "light" ? <SunIcon className="icon-segment-glyph" /> : <MoonIcon className="icon-segment-glyph" />}
          <span className="sr-only">{modes[item]}</span>
        </button>
      ))}
    </div>
  );
}
