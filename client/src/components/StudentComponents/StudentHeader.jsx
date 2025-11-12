import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const StudentHeader = ({ onMenuToggle }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser?.user_id) {
            const res = await fetch(
              `${import.meta.env.VITE_BACKEND_API_URL}/users/${parsedUser.user_id}`
            );
            const data = await res.json();
            if (data.status === "success") {
              setUser(data.data);
            } else {
              console.warn("User fetch failed:", data.message);
              setUser(parsedUser); // fallback to stored user
            }
          }
        } catch (err) {
          console.error("Error fetching user:", err);
        }
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);

      
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/logout/${parsedUser.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("Error during logout:", err);
  } finally {
    // ✅ Remove user data locally
    localStorage.removeItem("user");
    window.location.href = "/";
  }
};


  const handleProfileClick = () => {
    navigate("/student/profilepage");
  };

  const getProfileImage = () => {
    if (!user) {
      return "/assets/studentpic.png"; // Default fallback if no user
    }

    if (user?.profile_image) {
      // Add base URL if image path is relative
      return `${import.meta.env.VITE_BACKEND_API_URL}/uploads/${user.profile_image}`.replace(
        /([^:]\/)\/+/g,
        "$1"
      );
    }
    // fallback: generate initials avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.full_name || user?.username || "User"
    )}&background=1b64a5&color=fff`;
  };

  return (
    <div
      className="relative px-4 lg:px-8 py-4 lg:py-3.5 bg-cover bg-center flex flex-col"
      style={{ backgroundImage: "url('/assets/headerbg.png')" }}
    >
      {/* Mobile Hamburger Menu */}
      <button
        onClick={onMenuToggle}
        className="absolute right-4 top-4 lg:hidden text-white z-10"
      >
        <svg
          width="24"
          height="24"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Breadcrumb */}
      <div className="text-white text-xs font-light mb-2">Pages &gt; Lessons</div>

      {/* Headings */}
      <div className="mb-4">
        <h1 className="text-white text-xl lg:text-2xl font-semibold">
          Welcome {user?.full_name || user?.username || "Student"}
        </h1>
        <p className="text-white text-sm font-light">
          Continue Your Language Learning Journey
        </p>
      </div>

      {/* Top-right controls */}
      <div className="flex items-center gap-4 lg:gap-6 w-full lg:w-auto lg:absolute lg:top-6 lg:right-8 justify-end lg:justify-start">
        {/* Notification Icon */}
        <button className="relative hover:cursor-pointer text-white flex-shrink-0">
          <svg
            className="w-5 h-5 lg:w-[26px] lg:h-[26px]"
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
          <span className="absolute top-0 right-0 lg:top-1 lg:right-2 h-2 w-2 rounded-full bg-red-600" />
        </button>

        {/* Dynamic User Avatar */}
        <img
          src={getProfileImage()}
          alt="User"
          onClick={handleProfileClick}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 cursor-pointer hover:scale-105 transition-transform border-2 border-white"
        />

        {/* Logout */}
        <button
          onClick={handleLogout}
          type="button"
          className="flex hover:cursor-pointer items-center gap-1 text-white text-xs lg:text-sm font-medium flex-shrink-0"
        >
          <svg
            className="w-4 h-4 lg:w-[22px] lg:h-[22px]"
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
            <path d="M9 12h8.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Logout
        </button>
      </div>

      {/* Search bar */}
      {/* <div className="w-full lg:absolute lg:top-20 lg:right-8 lg:w-[260px] mt-4 lg:mt-0">
        <input
          type="text"
          placeholder="Search"
          className="w-full bg-white rounded-lg px-3 lg:px-4 py-1.5 lg:py-2 text-gray-700 shadow focus:outline-none text-sm"
        />
      </div> */}
    </div>
  );
};

export default StudentHeader;