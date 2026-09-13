import {
  ArrowLeft,
  BadgeCheck,
  Box,
  Check,
  Download,
  ExternalLink,
  Hammer,
  Info,
  Printer,
  Route,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Wrench,
  createIcons,
} from "lucide";
import "./styles.css";
import "./info.css";

createIcons({
  icons: {
    ArrowLeft,
    BadgeCheck,
    Box,
    Check,
    Download,
    ExternalLink,
    Hammer,
    Info,
    Printer,
    Route,
    Settings2,
    ShieldCheck,
    Sparkles,
    Sun,
    Wrench,
  },
});

const themeToggle = document.querySelector<HTMLInputElement>("#guide-theme-toggle");
const storedTheme = localStorage.getItem("box-generator-theme");
const initialTheme = storedTheme === "light" || storedTheme === "dark"
  ? storedTheme
  : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

document.documentElement.dataset.theme = initialTheme;
if (themeToggle) {
  themeToggle.checked = initialTheme === "dark";
  themeToggle.addEventListener("change", () => {
    const nextTheme = themeToggle.checked ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("box-generator-theme", nextTheme);
  });
}
