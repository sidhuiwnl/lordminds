import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const TeacherSidebar = ({ isOpen, onClose, isMobile = false }) => {
  const [isResultsOpen, setIsResultsOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState("home");
  const navigate = useNavigate();
  const location = useLocation();

  // 🧭 Sync active menu with current route
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath.includes("currentmarks")) setActiveMenu("current-marks");
    else if (currentPath.includes("assignmentmarks")) setActiveMenu("assignment-marks");
    else if (currentPath.includes("totalduration")) setActiveMenu("total-duration");
    else if (currentPath.includes("overallresult")) setActiveMenu("overall-results");
    else setActiveMenu("home");
  }, [location.pathname]);

  // 🪟 Prevent scroll when sidebar is open on mobile
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = isOpen ? "hidden" : "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen, isMobile]);

  const handleMenuClick = (menuName, path) => {
    setActiveMenu(menuName);
    navigate(path);
    if (isMobile && onClose) onClose();
  };

  const handleSubMenuClick = (subMenuName, path) => {
    setActiveMenu(subMenuName);
    setIsResultsOpen(true);
    navigate(path);
    if (isMobile && onClose) onClose();
  };

  const sidebarClasses = `
    flex flex-col h-full bg-gradient-to-b from-[#1b65a6] to-[#0d4a8a] text-white shadow-2xl overflow-y-auto transition-transform duration-300 ease-in-out
    ${isMobile
      ? `fixed inset-y-0 left-0 z-50 w-80 transform ${isOpen ? "translate-x-0" : "-translate-x-full"}`
      : "w-64"
    }
    lg:translate-x-0 lg:static lg:inset-auto
  `;

  return (
    <>
      {/* Dimmed overlay for mobile */}
      {isMobile && isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
        ></div>
      )}

      {/* Sidebar */}
      <div className={sidebarClasses}>
        {/* Top Logo and Title */}
        <div className="p-4 lg:p-6 pb-2 lg:pb-4 mt-3 border-b border-blue-400/20 flex-shrink-0 relative">
          <div className="flex items-center gap-3 mb-4">
            <img
              src="/assets/logo.png"
              alt="Language Tutor Logo"
              className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg shadow-md"
            />
            <div>
              <h2 className="font-bold text-base lg:text-lg leading-tight">Language Tutor</h2>
              <p className="text-blue-100 text-xs font-medium hidden sm:block">
                Professional Platform
              </p>
            </div>
          </div>

          {/* Mobile Close Button */}
          {isMobile && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 lg:hidden text-white"
            >
              <svg
                width="24"
                height="24"
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

        {/* Navigation */}
        <nav className="flex-1 p-2 lg:pl-4 lg:py-6 space-y-1">
          {/* Home */}
          <button
            onClick={() => handleMenuClick("home", "/teacher/teacherhome")}
            className={`flex items-center gap-3 w-full px-3 py-3 font-medium transition-all duration-200 rounded-l-3xl text-sm lg:text-base ${
              activeMenu === "home"
                ? "bg-white text-[#1b65a6] shadow-lg transform scale-[1.02]"
                : "bg-transparent hover:bg-blue-500/30 hover:shadow-md"
            }`}
          >
            <svg height="22" width="22" viewBox="0 0 26 26" fill="currentColor">
              <rect x="2" y="2" width="8" height="8" rx="1.5" />
              <rect x="16" y="2" width="8" height="8" rx="1.5" />
              <rect x="2" y="16" width="8" height="8" rx="1.5" />
              <rect x="16" y="16" width="8" height="8" rx="1.5" />
            </svg>
            <span className="font-semibold">Home</span>
          </button>

          {/* Reports Section */}
          <div className="space-y-1">
            <button
              onClick={() => setIsResultsOpen(!isResultsOpen)}
              className={`flex items-center gap-3 w-full px-3 py-3 font-semibold transition-all duration-200 rounded-l-3xl text-sm lg:text-base ${
                activeMenu.startsWith("results")
                  ? "bg-white text-[#1b65a6] shadow-lg"
                  : "bg-transparent hover:bg-blue-500/30 hover:shadow-md"
              }`}
            >
              <svg height="22" width="22" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="6" width="16" height="12" rx="2" />
                <circle cx="8" cy="12" r="2" fill="#fff" />
              </svg>
              <span>Reports</span>
              <span
                className={`ml-auto transition-transform duration-200 ${
                  isResultsOpen ? "rotate-180" : ""
                }`}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
                  <path stroke="currentColor" strokeWidth="2" d="M5 8l4 4 4-4" />
                </svg>
              </span>
            </button>

            {/* Submenu Items */}
            {isResultsOpen && (
              <div className="ml-4 lg:ml-2 space-y-1 border-l-2 border-blue-400/30 pl-2 py-1">
                {[
                  { id: "current-marks", label: "Current Marks", path: "/teacher/currentmarks" },
                  { id: "assignment-marks", label: "Assignment Marks", path: "/teacher/assignmentmarks" },
                  { id: "total-duration", label: "Total Duration", path: "/teacher/totalduration" },
                  { id: "overall-results", label: "Overall Results", path: "/teacher/overallresult" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSubMenuClick(item.id, item.path)}
                    className={`flex items-center gap-3 w-full px-3 py-2 font-medium transition-all duration-200 rounded-lg text-xs lg:text-sm ${
                      activeMenu === item.id
                        ? "bg-white text-[#1b65a6] shadow-md ml-2"
                        : "bg-transparent hover:bg-blue-500/20 text-blue-200/80"
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="p-3 lg:p-4 border-t border-blue-400/20 flex-shrink-0">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 lg:p-3 mb-3 shadow-inner">
            <img
              src="/assets/sidebarimage.png"
              alt="Learning Progress Visualization"
              className="w-full h-auto rounded-lg shadow-md"
            />
          </div>
          <div className="bg-white px-2 lg:px-3 py-1 lg:py-2 text-xs rounded-lg text-center text-[#1b65a6] font-semibold shadow-lg border border-blue-100">
            Copyright © {new Date().getFullYear()}
            <br />
            LordMinds.com
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherSidebar;
