import React from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react"; // 👈 Using lucide-react for icons

const LoginPage = () => {
  const navigate = useNavigate();

  const [loginData, setLoginData] = React.useState({
    username: "",
    password: "",
  });

  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false); // 👈 New state

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", loginData.username);
      formData.append("password", loginData.password);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/users/login`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Invalid username or password");
      }

      // Save user to localStorage
      localStorage.setItem("user", JSON.stringify(result.data));

      // ======================
      // 🎯 Onboarding Redirect
      // ======================
      if (result.data.role === "student") {
        const userId = result.data.user_id;

        const onboardRes = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}/student/${userId}/is-onboarded`
        );

        const onboardData = await onboardRes.json();

        if (!onboardData.is_onboarded) {
          navigate("/onboard");
        } else {
          navigate("/student/studenthome");
        }

        return; // stop here
      }

      // ======================
      // Other Roles (no onboarding)
      // ======================
      if (result.data.role === "admin") {
        navigate("/admin/adminhome");
      } else if (result.data.role === "super_admin") {
        navigate("/superadmin/superadminhome");
      } else if (result.data.role === "administrator") {
        navigate("/administrator/administratorhome");
      } else if (result.data.role === "teacher") {
        navigate("/teacher/teacherhome");
      } else {
        navigate("/");
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#f3f6f8]">
      {/* Right Side Image */}
      <div
        className="order-1 lg:order-2 w-full lg:flex-1 bg-cover bg-center h-64 lg:h-auto"
        style={{
          backgroundImage: "url('/assets/loginsideimage.png')",
        }}
      />

      {/* Left Side Login Card */}
      <div className="order-2 lg:order-1 flex-1 bg-[#1b65a6] lg:rounded-tr-[40%] flex flex-col items-center justify-center lg:justify-start p-4 lg:pt-16 lg:p-0">
        <div className="text-center w-full max-w-[400px] mx-auto">
          <img
            src="/assets/logo.png"
            alt="logo"
            className="w-12 lg:w-16 mx-auto mb-4"
          />
          <h2 className="text-white font-bold text-xl lg:text-2xl">
            Language Tutor Portal
          </h2>
          <p className="text-[#d1d9e6] mt-1 mb-6 lg:mb-10 text-sm lg:text-base">
            Professional Language Learning Platform
          </p>

          {/* Login Form */}
          <form
            onSubmit={handleLogin}
            className="bg-white rounded-xl shadow-lg px-6 lg:px-10 py-8 lg:py-10 text-left"
          >
            <h3 className="text-[#222] font-semibold text-xl lg:text-2xl mb-1 text-center">
              Welcome Back
            </h3>
            <p className="text-gray-600 text-xs lg:text-sm mb-4 lg:mb-6 text-center">
              Please enter your credentials to access your account
            </p>

            {error && (
              <div className="bg-red-100 text-red-600 text-sm p-2 rounded mb-3 text-center">
                {error}
              </div>
            )}

            {/* Username Input */}
            <label
              className="block text-gray-700 font-semibold mb-1 mt-2 text-sm"
              htmlFor="username"
            >
              Username
            </label>
            <div className="relative mb-3 lg:mb-4">
              <input
                id="username"
                type="text"
                value={loginData.username}
                onChange={(e) =>
                  setLoginData({ ...loginData, username: e.target.value })
                }
                placeholder="Enter your roll number"
                className="w-full border border-gray-300 rounded-md py-2 pl-4 pr-10 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <span className="absolute right-3 top-2.5 text-gray-400 text-base lg:text-lg">
                &#128100;
              </span>
            </div>

            {/* Password Input */}
            <label
              className="block text-gray-700 font-semibold mb-1 text-sm"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative mb-4 lg:mb-6">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                placeholder="Enter your password"
                className="w-full border border-gray-300 rounded-md py-2 pl-4 pr-10 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />

              {/* 👁️ Eye icon for toggling visibility */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-yellow-400 text-[#222] font-bold py-2 lg:py-3 rounded-md transition duration-200 text-sm lg:text-lg mb-1 ${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-yellow-500"
                }`}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <hr className="my-4 lg:my-6 border-gray-200" />

            {/* <p className="text-center text-xs lg:text-sm text-blue-600">
              Don't have an account?{" "}
              <a href="/onboard" className="underline font-semibold">
                Create New Profile
              </a>
            </p> */}
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
