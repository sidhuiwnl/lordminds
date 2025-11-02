import React, { useState } from "react";
import AdministratorHeader from "../../components/AdministratorComponents/AdministratorHeader";
import AdministratorSidebar from "../../components/AdministratorComponents/AdministratorSidebar";
import AdministratorHome from "../../components/AdministratorComponents/AdministratorHome";

const AdministratorHomePage = () => {
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
      <AdministratorSidebar 
        isOpen={isMobileMenuOpen} 
        onClose={toggleMobileMenu} 
        isMobile={true}
      />

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AdministratorHeader onMenuToggle={toggleMobileMenu} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <AdministratorHome />
        </main>
      </div>
    </div>
  );
};

export default AdministratorHomePage;