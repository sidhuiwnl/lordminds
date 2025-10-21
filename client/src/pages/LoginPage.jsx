import React from "react";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();

  const [loginData, setLoginData] = React.useState({
    username: "",
    password: "",
  });

  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

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
          body: formData, // ✅ Sending FormData, not JSON
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Invalid username or password");
      }

      // ✅ Optional: Save user info to localStorage/session
      localStorage.setItem("user", JSON.stringify(result.data));

      // ✅ Navigate based on role if needed
      if (result.data.role === "student") {
        navigate("/student/studenthome");
      } else if (result.data.role === "teacher") {
        navigate("/teacher/dashboard");
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

            <label
              className="block text-gray-700 font-semibold mb-1 text-sm"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative mb-4 lg:mb-6">
              <input
                id="password"
                type="password"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                placeholder="Enter your password"
                className="w-full border border-gray-300 rounded-md py-2 pl-4 pr-10 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <span className="absolute right-3 top-2.5 text-gray-400 text-base lg:text-lg">
                &#128274;
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-yellow-400 text-[#222] font-bold py-2 lg:py-3 rounded-md transition duration-200 text-sm lg:text-lg mb-1 ${
                loading ? "opacity-70 cursor-not-allowed" : "hover:bg-yellow-500"
              }`}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <hr className="my-4 lg:my-6 border-gray-200" />

            <p className="text-center text-xs lg:text-sm text-blue-600">
              Don't have an account?{" "}
              <a href="#" className="underline font-semibold">
                Create New Profile
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
