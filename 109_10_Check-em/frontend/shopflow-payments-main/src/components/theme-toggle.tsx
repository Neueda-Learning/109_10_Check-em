import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const THEME_KEY = "payflow.theme";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = (localStorage.getItem(THEME_KEY) as Theme) ?? "light";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  };

  return (
    <button
      onClick={toggle}
      className="
        flex h-11 w-11 items-center justify-center
        rounded-full
        border border-white/30
        bg-white/20
        text-white
        backdrop-blur-md
        transition-all
        duration-200
        hover:scale-105
        hover:bg-white
        hover:text-teal-700
        dark:border-white/20
        dark:bg-white/10
        dark:text-white
        dark:hover:bg-white
        dark:hover:text-teal-900
      "
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5 text-yellow-300" />
      )}
    </button>
  );
}