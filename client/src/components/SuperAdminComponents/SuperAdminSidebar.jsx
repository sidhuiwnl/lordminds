import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SuperAdminSidebar = ({ isOpen, onClose, isMobile = false }) => {
  const [activeMenu, setActiveMenu] = useState("home");
  const navigate = useNavigate();

  const handleMenuClick = (menuName, path) => {
    setActiveMenu(menuName);
    navigate(path);
    if (isMobile && onClose) onClose();
  };

  const sidebarClasses = `
    flex flex-col h-full bg-gradient-to-b from-[#1b65a6] to-[#0d4a8a] text-white shadow-2xl overflow-y-auto transition-transform duration-300 ease-in-out
    ${isMobile 
      ? `fixed inset-y-0 left-0 z-50 w-72 sm:w-80 -translate-x-full ${isOpen ? 'translate-x-0' : ''}` 
      : 'w-64'
    }
    lg:translate-x-0 lg:static lg:inset-auto
  `;

  return (
    <div className={sidebarClasses}>
      {/* Top Logo and Titles */}
      <div className="p-3 sm:p-4 lg:p-6 pb-2 lg:pb-4 border-b border-blue-400/20 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <img 
            src="/assets/logo.png" 
            alt="Language Tutor Logo" 
            className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg shadow-md flex-shrink-0" 
          />
          <div className="min-w-0">
            <h2 className="font-bold text-sm sm:text-base lg:text-lg leading-tight truncate">
              Language Tutor
            </h2>
            <p className="text-blue-100 text-xs font-medium hidden sm:block">
              Professional Platform
            </p>
          </div>
        </div>
        {/* Mobile Close Button */}
        {isMobile && (
          <button 
            onClick={onClose} 
            className="absolute top-3 sm:top-4 right-3 sm:right-4 lg:hidden text-white"
          >
            <svg width="20" height="20" className="sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-1 sm:p-2 lg:pl-4 lg:py-6 space-y-1">
        {/* Home */}
        <button
          onClick={() => handleMenuClick("home", "/superadmin/superadminhome")}
          className={`flex items-center gap-2 sm:gap-3 w-full px-2 sm:px-3 py-2 sm:py-3 font-medium transition-all duration-200 rounded-l-3xl text-xs sm:text-sm lg:text-base ${
            activeMenu === "home"
              ? "bg-white text-[#1b65a6] shadow-lg transform scale-[1.02]"
              : "bg-transparent hover:bg-blue-500/30 hover:shadow-md"
          }`}
        >
          <span className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6">
            <svg className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" viewBox="0 0 26 26" fill="currentColor">
              <rect x="2" y="2" width="8" height="8" rx="1.5" />
              <rect x="16" y="2" width="8" height="8" rx="1.5" />
              <rect x="2" y="16" width="8" height="8" rx="1.5" />
              <rect x="16" y="16" width="8" height="8" rx="1.5" />
            </svg>
          </span>
          <span className="font-semibold truncate">Home</span>
        </button>

        {/* Reports */}
        <button
          onClick={() => handleMenuClick("reports", "/superadmin/reports")}
          className={`flex items-center gap-2 sm:gap-3 w-full px-2 sm:px-3 py-2 sm:py-3 font-medium transition-all duration-200 rounded-l-3xl text-xs sm:text-sm lg:text-base ${
            activeMenu === "reports"
              ? "bg-white text-[#1b65a6] shadow-lg transform scale-[1.02]"
              : "bg-transparent hover:bg-blue-500/30 hover:shadow-md"
          }`}
        >
          <span className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6">
            <svg className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="6" width="16" height="12" rx="2" />
              <circle cx="8" cy="12" r="2" fill="#fff" />
            </svg>
          </span>
          <span className="font-semibold truncate">Reports</span>
        </button>

        {/* Upload */}
        <button
          onClick={() => handleMenuClick("upload", "/superadmin/uploads")}
          className={`flex items-center gap-2 sm:gap-3 w-full px-2 sm:px-3 py-2 sm:py-3 font-medium transition-all duration-200 rounded-l-3xl text-xs sm:text-sm lg:text-base ${
            activeMenu === "upload"
              ? "bg-white text-[#1b65a6] shadow-lg transform scale-[1.02]"
              : "bg-transparent hover:bg-blue-500/30 hover:shadow-md"
          }`}
        >
          <span className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6">
            <svg className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </span>
          <span className="font-semibold truncate">Upload</span>
        </button>

        {/* Access Creation */}
        <button
          onClick={() => handleMenuClick("access-creation", "/superadmin/access-creation")}
          className={`flex items-center gap-2 sm:gap-3 w-full px-2 sm:px-3 py-2 sm:py-3 font-medium transition-all duration-200 rounded-l-3xl text-xs sm:text-sm lg:text-base ${
            activeMenu === "access-creation"
              ? "bg-white text-[#1b65a6] shadow-lg transform scale-[1.02]"
              : "bg-transparent hover:bg-blue-500/30 hover:shadow-md"
          }`}
        >
          <span className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6">
            <svg className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <polyline points="17 11 19 13 23 9"></polyline>
            </svg>
          </span>
          <span className="font-semibold truncate">Access Creation</span>
        </button>
      </nav>

      {/* Bottom Section */}
      <div className="p-2 sm:p-3 lg:p-4 border-t border-blue-400/20 flex-shrink-0">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-1 sm:p-2 lg:p-3 mb-2 sm:mb-3 shadow-inner">
          <img
            src="/assets/sidebarimage.png"
            alt="Learning Progress Visualization"
            className="w-full h-24 sm:h-28 lg:h-auto rounded-lg shadow-md object-cover"
          />
        </div>
        <div className="bg-white px-1 sm:px-2 lg:px-3 py-1 lg:py-2 text-xs rounded-lg text-center text-[#1b65a6] font-semibold shadow-lg border border-blue-100 leading-tight">
          Copyright © {new Date().getFullYear()}<br className="hidden sm:block" />
          LordMinds.com
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSidebar;