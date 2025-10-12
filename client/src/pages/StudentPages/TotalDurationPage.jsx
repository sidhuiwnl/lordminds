import React, { useState } from "react";
import StudentHeader from "../../components/StudentComponents/StudentHeader";
import Sidebar from "../../components/StudentComponents/Sidebar";
import TotalDuration from "../../components/StudentComponents/TotalDuration";

const TotalDurationPage = () => {
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
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={toggleMobileMenu} 
        isMobile={true}
      />

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <StudentHeader onMenuToggle={toggleMobileMenu} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <TotalDuration />
        </main>
      </div>
    </div>
  );
};

export default TotalDurationPage;