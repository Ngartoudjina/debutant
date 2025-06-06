import { useEffect, useState } from "react";
import Navbar from "./components/pages/Navbar";
import Footer from "./components/pages/Footer";
import Header from "./components/pages/Header";
import CookieConsentBanner from "./components/cookies/CookieConsentBanner";
import Section3 from "./components/pages/Section3";
import Section2 from "./components/pages/Section2";
import Section4 from "./components/pages/Section4";
import ThemeToggle from './components/pages/ThemeToggle';
import NotificationsSetup from './components/pages/NotificationsSetup';



function App() {

  const [darkMode, setDarkMode] = useState(false);
  
    useEffect(() => {
      document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);
  
    const toggleDarkMode = () => {
      setDarkMode((prev) => !prev);
    };

  return (
    <div>
      <NotificationsSetup />
      <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <Navbar />
      <Header />
      <Section3 />
      <Section2 />
      <Section4 />
      <Footer />
      <CookieConsentBanner />
    </div>
  );
}

export default App;