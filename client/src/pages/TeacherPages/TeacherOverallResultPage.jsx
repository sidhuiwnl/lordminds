import React, { useState } from "react";
import TeacherHeader from "../../components/TeacherComponents/TeacherHeader";
import TeacherSidebar from "../../components/TeacherComponents/TeacherSIdebar";
import TeacherOverallResult from "../../components/TeacherComponents/TeacherOverallResult";

const TeacherOverallResultPage = () => {
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
      <TeacherSidebar 
        isOpen={isMobileMenuOpen} 
        onClose={toggleMobileMenu} 
        isMobile={true}
      />

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <TeacherHeader onMenuToggle={toggleMobileMenu} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <TeacherOverallResult />
        </main>
      </div>
    </div>
  );
};

export default TeacherOverallResultPage;