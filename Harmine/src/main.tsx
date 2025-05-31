import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import "./index.css";
import AppWrapper from "./AppWrapper"; // Nouveau composant à créer

const root = createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <StrictMode>
    <Router>
      <AppWrapper />
    </Router>
  </StrictMode>
);