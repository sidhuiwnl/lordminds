import React, { useState } from "react";
import TeacherSidebar from "../../components/TeacherComponents/TeacherSIdebar";
import TeacherDuration from "../../components/TeacherComponents/TeacherDuration";

const TeacherDurationPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 lg:bg-white">

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar (Drawer on mobile, Static on desktop) */}
      <div
        className={`
          ${isMobileMenuOpen ? "fixed inset-y-0 left-0 z-50 w-80" : "hidden"}
          lg:relative lg:flex lg:w-80
        `}
      >
        <TeacherSidebar
          isOpen={isMobileMenuOpen}
          onClose={toggleMobileMenu}
          isMobile={true}
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Mobile Menu Toggle */}
        <div className="lg:hidden absolute top-4 left-4 z-30">
          <button
            onClick={toggleMobileMenu}
            className="p-2 bg-white rounded-lg shadow-md text-gray-600
                     hover:text-gray-900 hover:bg-gray-100 transition-colors
                     border border-gray-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          <TeacherDuration />
        </main>
      </div>
    </div>
  );
};

export default TeacherDurationPage;
