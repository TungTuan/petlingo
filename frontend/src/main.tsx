import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AdminApp from "./admin/AdminApp.tsx";
import App from "./App.tsx";

// No router library in this app (the kid-facing app is a single full-screen
// game surface that switches "screens" via state, not URLs). The admin
// dashboard is a genuinely separate surface though, so it gets its own real
// path — a plain pathname check is all two branches need.
const isAdmin = location.pathname.startsWith("/admin");
if (isAdmin) document.documentElement.dataset.app = "admin";

createRoot(document.getElementById("root")!).render(
  <StrictMode>{isAdmin ? <AdminApp /> : <App />}</StrictMode>,
);
