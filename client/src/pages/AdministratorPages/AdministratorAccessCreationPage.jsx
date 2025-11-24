import React, { useState } from "react";
import AdministratorSidebar from "../../components/AdministratorComponents/AdministratorSidebar";
import AdministratorAccessCreation from "../../components/AdministratorComponents/AdministratorCreation";

const AdministratorAccessCreationPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 lg:bg-white">

      {/* 🔹 Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* 🔹 Sidebar (same behavior as SuperAdmin) */}
      <div
        className={`
          ${isMobileMenuOpen ? "fixed inset-y-0 left-0 z-50 w-80" : "hidden"}
          lg:relative lg:flex lg:w-80
        `}
      >
        <AdministratorSidebar
          isOpen={isMobileMenuOpen}
          onClose={toggleMobileMenu}
          isMobile={true}
        />
      </div>

      {/* 🔹 Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* 🔹 Minimal Mobile Toggle Button */}
        <div className="lg:hidden absolute top-4 left-4 z-30">
          <button
            onClick={toggleMobileMenu}
            className="p-2 bg-white rounded-lg shadow-md text-gray-600 
                       hover:text-gray-900 hover:bg-gray-100 
                       transition-colors border border-gray-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* 🔹 Page Body */}
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          <AdministratorAccessCreation />
        </main>
      </div>
    </div>
  );
};

export default AdministratorAccessCreationPage;
