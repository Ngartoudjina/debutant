import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PrivateRoute from "./components/pages/PrivateRoute";
import { useTheme } from './components/context/ThemeContext';

// Lazy-loaded page components
const App = lazy(() => import("./App"));
const SignIn = lazy(() => import("./components/pages/SignIn"));
const SignUp = lazy(() => import("./components/pages/SignUp"));
const Coursier = lazy(() => import("./components/pages/Coursier"));
const Propos = lazy(() => import("./components/pages/Propos"));
const Reserv = lazy(() => import("./components/pages/Reserv"));
const Suivi = lazy(() => import("./components/pages/Suivi"));
const Cookies = lazy(() => import("./components/pages/Cookies"));
const Confidential = lazy(() => import("./components/pages/Confidential"));
const Termes = lazy(() => import("./components/pages/Termes"));
const NotFound = lazy(() => import("./components/pages/NotFound"));
const VerifyEmail = lazy(() => import("./components/pages/VerifyEmail"));
const Entreprise = lazy(() => import("./components/pages/Entreprise"));
const Client = lazy(() => import("./components/pages/Client"));
const Contact = lazy(() => import("./components/pages/Contact"));
const Admin = lazy(() => import("./components/ADMIN/Admin"));
const ResetPassword = lazy(() => import("./components/pages/ResetPassword"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function AppWrapper() {
  const googleClientId = import.meta.env.VITE_APP_GOOGLE_CLIENT_ID;
  const { isDarkMode } = useTheme();

  return (
    <GoogleOAuthProvider clientId={googleClientId || ""}>
      <ToastContainer
        position="top-right"
        theme={isDarkMode ? "dark" : "light"}
        aria-live="polite"
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/inscription" element={<SignUp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/coursier" element={<PrivateRoute><Coursier /></PrivateRoute>} />
          <Route path="/client" element={<PrivateRoute><Client /></PrivateRoute>} />
          <Route path="/entreprise" element={<PrivateRoute><Entreprise /></PrivateRoute>} />
          <Route path="/propos" element={<Propos />} />
          <Route path="/reserv" element={<PrivateRoute><Reserv /></PrivateRoute>} />
          <Route path="/suivi" element={<PrivateRoute><Suivi /></PrivateRoute>} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/confidential" element={<Confidential />} />
          <Route path="/termes" element={<Termes />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/admin" element={<PrivateRoute requireAdmin={true}><Admin /></PrivateRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </GoogleOAuthProvider>
  );
}

export default AppWrapper;
