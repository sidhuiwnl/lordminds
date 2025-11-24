import React, { useState } from "react";
import Sidebar from "../../components/StudentComponents/Sidebar";
import TotalDuration from "../../components/StudentComponents/TotalDuration";

const TotalDurationPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  return (
    <div className="flex h-screen bg-gray-50 lg:bg-white">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={toggleMobileMenu}
        isMobile={true}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Floating Hamburger — Hidden when menu open */}
        <div
          className={`lg:hidden fixed top-4 left-4 z-50 transition-all duration-300 ease-out ${
            isMobileMenuOpen
              ? "opacity-0 pointer-events-none scale-90"
              : "opacity-100 scale-100"
          }`}
        >
          <button
            onClick={toggleMobileMenu}
            className="p-3 bg-white rounded-xl shadow-lg 
                       text-gray-700 hover:text-gray-900 hover:bg-gray-50 
                       transition-all duration-200 border border-gray-200 
                       active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pt-20 lg:pt-0 bg-gray-50">
          <div className="px-4 lg:px-0">
            <TotalDuration />
          </div>
        </main>
      </div>
    </div>
  );
};

export default TotalDurationPage;