import React from "react";
import { Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import App from "./App";
import SignIn from "./components/pages/SignIn";
import SignUp from "./components/pages/SignUp";
import Coursier from "./components/pages/Coursier";
import Propos from "./components/pages/Propos";
import Reserv from "./components/pages/Reserv";
import Suivi from "./components/pages/Suivi";
import Cookies from "./components/pages/Cookies";
import Confidential from "./components/pages/Confidential";
import Termes from "./components/pages/Termes";
import NotFound from "./components/pages/NotFound";
import VerifyEmail from "./components/pages/VerifyEmail";
import Entreprise from "./components/pages/Entreprise";
import Client from "./components/pages/Client";
import Contact from "./components/pages/Contact";
import Admin from "./components/ADMIN/Admin";
import PrivateRoute from "./components/pages/PrivateRoute";

// Typage pour les routes
type RouteConfig = {
  path: string;
  element: React.ReactNode;
};

// Tableau de routes avec typage
const routes: RouteConfig[] = [
  { path: "/", element: <App /> },
  { path: "/login", element: <SignIn /> },
  { path: "/inscription", element: <SignUp /> },
  { path: "/coursier", element: <PrivateRoute><Coursier /></PrivateRoute> },
  { path: "/client", element: <PrivateRoute><Client /></PrivateRoute> },
  { path: "/entreprise", element: <PrivateRoute><Entreprise /></PrivateRoute> },
  { path: "/propos", element: <Propos /> },
  { path: "/reserv", element: <PrivateRoute><Reserv /></PrivateRoute> },
  { path: "/suivi", element: <PrivateRoute><Suivi /></PrivateRoute> },
  { path: "/cookies", element: <Cookies /> },
  { path: "/contact", element: <Contact /> },
  { path: "/confidential", element: <Confidential /> },
  { path: "/termes", element: <Termes /> },
  { path: "/verify-email", element: <VerifyEmail /> },
  { path: "/admin", element: <PrivateRoute requireAdmin={true}><Admin /></PrivateRoute> },
  { path: "*", element: <NotFound /> },
];

function AppWrapper() {
  const googleClientId = import.meta.env.VITE_APP_GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    console.error('VITE_APP_GOOGLE_CLIENT_ID is not defined in .env');
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId || ''}>
      <ToastContainer position="top-right" theme="dark" />
      <Routes>
        {routes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}
      </Routes>
    </GoogleOAuthProvider>
  );
}

export default AppWrapper;