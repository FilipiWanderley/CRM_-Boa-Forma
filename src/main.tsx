import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import { applyStoredUnitTheme } from "./hooks/useUnitTheme";

// Apply stored unit theme before React hydration
applyStoredUnitTheme();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="boaforma-theme">
    <App />
  </ThemeProvider>
);