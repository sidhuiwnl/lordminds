import React from "react";
import { useNavigate } from "react-router-dom";

const AdminHeader = ({ onMenuToggle }) => {

  const navigate = useNavigate();

  return (
    <div
      className="relative px-4 sm:px-8 py-4 sm:py-6 bg-cover bg-center flex flex-col"
      style={{
        backgroundImage: "url('/assets/headerbg.png')",
      }}
    >
      {/* Mobile Hamburger Menu */}
      <button 
        onClick={onMenuToggle} 
        className="absolute right-4 top-4 sm:hidden text-white z-10"
      >
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Breadcrumb */}
      <div className="text-white text-xs font-light mb-1 sm:mb-2">
        Pages &gt; Admin
      </div>

      {/* Headings */}
      <div className="mb-4">
        <h1 className="text-white text-xl sm:text-2xl font-semibold">
          Welcome Naveen
        </h1>
        <p className="text-white text-xs sm:text-sm font-light">
          Admin
        </p>
      </div>

      {/* Top-right controls */}
      <div className="flex items-center gap-2 sm:gap-6 w-full sm:w-auto sm:absolute sm:top-6 sm:right-8 justify-end sm:justify-start">
        {/* Notification Icon */}
        <button className="relative text-white flex-shrink-0">
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="absolute top-0 sm:top-1 right-0 sm:right-1 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-600" />
        </button>

        {/* User avatar */}
        <img
          src="/assets/superadminpic.png"
          alt="User"
          className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border-2 flex-shrink-0"
        />

        {/* Logout */}
        <button 
        onClick={() => {
          navigate("/");
        }}
        className="flex items-center hover:cursor-pointer gap-1 text-white text-xs sm:text-sm font-medium flex-shrink-0">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 12h8.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Logout
        </button>
      </div>

      {/* Search bar */}
      <div className="w-full sm:absolute sm:top-20 sm:right-8 sm:w-[260px] mt-4 sm:mt-0 max-w-[calc(100%-2rem)] sm:max-w-none">
        <input
          type="text"
          placeholder="Search"
          className="w-full bg-white rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-gray-700 shadow focus:outline-none text-sm"
        />
      </div>
    </div>
  );
};

export default AdminHeader;