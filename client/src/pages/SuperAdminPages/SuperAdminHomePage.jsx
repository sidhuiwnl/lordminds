import React, { useState } from "react";
import SuperAdminHeader from "../../components/SuperAdminComponents/SuperAdminHeader";
import SuperAdminSidebar from "../../components/SuperAdminComponents/SuperAdminSidebar";
import SuperAdminHome from "../../components/SuperAdminComponents/SuperAdminHome";

const SuperAdminHomePage = () => {
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

      {/* Sidebar */}
      <SuperAdminSidebar 
        isOpen={isMobileMenuOpen} 
        onClose={toggleMobileMenu} 
        isMobile={true}
      />

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <SuperAdminHeader onMenuToggle={toggleMobileMenu} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <SuperAdminHome />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminHomePage;