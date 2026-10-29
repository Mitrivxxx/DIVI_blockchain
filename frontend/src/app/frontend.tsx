/**
 * Entry point for the React app — mounts App into #root.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./style/global.scss";
import "./index.scss";
import "@/styles/tailwind.css";
import App from "./App";

document.body.dataset.mount = "root";

const elem = document.getElementById("root");
if (!elem) {
  throw new Error("Missing mount element: #root");
}

const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

if (import.meta.hot) {
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  createRoot(elem).render(app);
}
