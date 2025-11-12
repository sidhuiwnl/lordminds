import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AdministratorSidebar = ({ isOpen, onClose, isMobile = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState("home");

  // ✅ Load active menu from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem("admin_active_menu");
    if (stored) setActiveMenu(stored);
  }, []);

  // ✅ Sync with route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("administratorhome")) setActiveMenu("home");
    else if (path.includes("administratorreports")) setActiveMenu("reports");
    else if (path.includes("administratoraccess")) setActiveMenu("access-creation");
  }, [location.pathname]);

  const handleMenuClick = (menuName, path) => {
    setActiveMenu(menuName);
    localStorage.setItem("admin_active_menu", menuName);
    navigate(path);
    if (isMobile && onClose) onClose();
  };

  const sidebarClasses = `
  flex flex-col h-full bg-gradient-to-b from-[#1b65a6] to-[#0d4a8a] text-white shadow-2xl
  overflow-y-auto transition-transform duration-300 ease-in-out
  ${isMobile 
    ? `fixed inset-y-0 left-0 z-50 w-72 sm:w-80 transform ${isOpen ? "translate-x-0" : "-translate-x-full"}`
    : "w-64"
  }
  lg:translate-x-0 lg:static lg:inset-auto
`;


  return (
    <aside className={sidebarClasses}>
      {/* 🔹 Header */}
      <div className="relative p-4 border-b border-blue-400/20 flex items-center gap-3">
        <img
          src="/assets/logo.png"
          alt="Language Tutor Logo"
          className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg shadow-md"
        />
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-base lg:text-lg truncate">Language Tutor</h2>
          <p className="text-blue-100 text-xs font-medium hidden sm:block">
            Professional Platform
          </p>
        </div>

        {/* 🔹 Mobile Close Button */}
        {isMobile && (
          <button
            onClick={onClose}
            className="absolute right-3 text-white hover:text-blue-200 transition"
          >
            <svg
              width="22"
              height="22"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 🔹 Navigation */}
      <nav className="flex-1 py-4 px-3 lg:px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {/* 🏠 Home */}
        <button
          onClick={() => handleMenuClick("home", "/administrator/administratorhome")}
          className={`flex items-center gap-3 w-full px-3 py-2.5 font-medium rounded-l-3xl transition-all duration-200 text-sm lg:text-base ${
            activeMenu === "home"
              ? "bg-white text-[#1b65a6] shadow-md transform scale-[1.02]"
              : "text-blue-100 hover:bg-blue-500/30 hover:text-white"
          }`}
        >
          <span className="flex-shrink-0 w-5 h-5 lg:w-6 lg:h-6">
            <svg viewBox="0 0 26 26" fill="currentColor" className="w-full h-full">
              <rect x="2" y="2" width="8" height="8" rx="1.5" />
              <rect x="16" y="2" width="8" height="8" rx="1.5" />
              <rect x="2" y="16" width="8" height="8" rx="1.5" />
              <rect x="16" y="16" width="8" height="8" rx="1.5" />
            </svg>
          </span>
          <span className="font-semibold truncate">Home</span>
        </button>

        {/* 📊 Reports */}
        <button
          onClick={() => handleMenuClick("reports", "/administrator/administratorreports")}
          className={`flex items-center gap-3 w-full px-3 py-2.5 font-medium rounded-l-3xl transition-all duration-200 text-sm lg:text-base ${
            activeMenu === "reports"
              ? "bg-white text-[#1b65a6] shadow-md transform scale-[1.02]"
              : "text-blue-100 hover:bg-blue-500/30 hover:text-white"
          }`}
        >
          <span className="flex-shrink-0 w-5 h-5 lg:w-6 lg:h-6">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <rect x="3" y="6" width="16" height="12" rx="2" />
              <circle cx="8" cy="12" r="2" fill="#fff" />
            </svg>
          </span>
          <span className="font-semibold truncate">Reports</span>
        </button>

        {/* 🧑‍💼 Access Creation */}
        <button
          onClick={() => handleMenuClick("access-creation", "/administrator/administratoraccess")}
          className={`flex items-center gap-3 w-full px-3 py-2.5 font-medium rounded-l-3xl transition-all duration-200 text-sm lg:text-base ${
            activeMenu === "access-creation"
              ? "bg-white text-[#1b65a6] shadow-md transform scale-[1.02]"
              : "text-blue-100 hover:bg-blue-500/30 hover:text-white"
          }`}
        >
          <span className="flex-shrink-0 w-5 h-5 lg:w-6 lg:h-6">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <polyline points="17 11 19 13 23 9"></polyline>
            </svg>
          </span>
          <span className="font-semibold truncate">Access Creation</span>
        </button>
      </nav>

      {/* 🔹 Footer */}
      <div className="p-3 lg:p-4 border-t border-blue-400/20 flex-shrink-0">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 lg:p-3 mb-3 shadow-inner">
          <img
            src="/assets/sidebarimage.png"
            alt="Learning Visualization"
            className="w-full h-28 object-cover rounded-lg shadow-md"
          />
        </div>
        <div className="bg-white text-[#1b65a6] text-center py-2 rounded-lg text-xs font-semibold shadow-md border border-blue-100 leading-tight">
          Copyright © {new Date().getFullYear()}
          <br className="hidden sm:block" />
          LordMinds.com
        </div>
      </div>
    </aside>
  );
};

export default AdministratorSidebar;
