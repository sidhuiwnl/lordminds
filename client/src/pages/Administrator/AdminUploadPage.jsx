import React, { useState } from "react";

import AdminHeader from "../../components/AdminComponents/AdminHeader";
import AdminSidebar from "../../components/AdminComponents/Sidebar";
import AdminUpload from "../../components/AdminComponents/AdminUpload";

const AdminUploadPage = () => {
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
      <AdminSidebar 
        isOpen={isMobileMenuOpen} 
        onClose={toggleMobileMenu} 
        isMobile={true}
      />

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        {/* <AdminHeader onMenuToggle={toggleMobileMenu} /> */}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <AdminUpload />
        </main>
      </div>
    </div>
  );
};

export default AdminUploadPage;