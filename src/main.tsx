import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { appBasename } from "./routing/useVitalityRoute";
import { AppStateProvider } from "./state/AppState";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/600.css";
import "@fontsource/open-sans/700.css";
import "@fontsource/lora/600.css";
import "@fontsource/lora/700.css";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root element.");

createRoot(root).render(
  <StrictMode>
    <AppStateProvider>
      <BrowserRouter basename={appBasename()}>
        <App />
      </BrowserRouter>
    </AppStateProvider>
  </StrictMode>,
);
