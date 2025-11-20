import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";


const ProfileComponent = () => {
  const [user, setUser] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
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
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, []);

  // Check if user is admin or superadmin
  const isAdminUser = user?.role_id === 2 || user?.role_id === 1;

  

  // 🔹 Upload image to backend
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?.user_id) return;

    setPreviewImage(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/users/${user.user_id}/add-image`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const data = await res.json();

      if (data.status === "success") {
        setUser((prev) => ({
          ...prev,
          profile_image: `${import.meta.env.VITE_BACKEND_API_URL}${data.file_url}`,
        }));

        Swal.fire({
          icon: "success",
          title: "Profile Updated",
          text: "Profile image uploaded successfully!",
          timer: 1800,
          showConfirmButton: false
        });

      } else {
        Swal.fire({
          icon: "error",
          title: "Upload Failed",
          text: data.message || "Something went wrong"
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while uploading."
      });
    } finally {
      setUploading(false);
    }
  };

  // 🔹 Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return Swal.fire({
        icon: "warning",
        title: "Mismatch",
        text: "Passwords do not match!"
      });
    }

    if (passwordData.newPassword.length < 6) {
      return Swal.fire({
        icon: "warning",
        title: "Too Short",
        text: "Password must be at least 6 characters!"
      });
    }

    setPasswordLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/users/${user.user_id}/change-password`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ new_password: passwordData.newPassword }),
        }
      );

      const data = await res.json();

      if (data.status === "success") {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Password changed successfully",
          timer: 1800,
          showConfirmButton: false
        });

        setPasswordData({ newPassword: "", confirmPassword: "" });
        setIsEditingPassword(false);
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: data.detail || "Unable to update password"
        });
      }
    } catch (error) {
      console.error("Error changing password:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while changing password."
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-gray-500 text-lg">No user data found.</div>
      </div>
    );
  }

  const getProfileImageSrc = () => {
    if (previewImage) return previewImage;
    if (user.profile_image)
      return `${import.meta.env.VITE_BACKEND_API_URL}/uploads/${
        user.profile_image
      }`.replace(/([^:]\/)\/+/g, "$1"); // prevent double slashes
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.full_name || user.username || "User"
    )}&background=1b64a5&color=fff&size=112`;
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4 py-8">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8 transition-all">
        {/* Go Back Button */}
        <div className="mb-6">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Go Back
          </button>
        </div>

        {/* Profile Image */}
        <div className="flex flex-col items-center relative">
          <div className="relative">
            <img
              src={getProfileImageSrc()}
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover border-4 border-blue-500 shadow-sm"
            />
            <label
              htmlFor="upload"
              className={`absolute bottom-0 right-0 bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 shadow-md ${
                uploading ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {uploading ? (
                <span className="text-sm animate-pulse">⏳</span>
              ) : (
                <span className="text-lg font-bold">+</span>
              )}
            </label>
            <input
              id="upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          <h2 className="text-xl font-semibold mt-4 text-gray-800">
            {user.full_name || user.username || "No Name"}
          </h2>
          <p className="text-gray-500">{user.username || "No Username"}</p>
          {user.role && (
            <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {user.role}
            </span>
          )}
        </div>

        {/* User Info Form */}
        <form className="mt-6 space-y-4 border-t border-gray-200 pt-4">
          {user.username && (
            <InputField label="Username" value={user.username} disabled />
          )}
          {user.full_name && (
            <InputField label="Full Name" value={user.full_name} disabled />
          )}
          {user.role && (
            <InputField label="Role" value={user.role} disabled />
          )}
          {user.created_at && (
            <InputField
              label="Joined On"
              value={new Date(user.created_at).toLocaleDateString()}
              disabled
            />
          )}
          {user.updated_at && (
            <InputField
              label="Updated On"
              value={new Date(user.updated_at).toLocaleDateString()}
              disabled
            />
          )}

          {/* Password Change Section - Only for Admin/SuperAdmin */}
          {isAdminUser && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-gray-600 text-sm font-medium">
                  Change Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsEditingPassword(!isEditingPassword)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {isEditingPassword ? "Cancel" : "Change Password"}
                </button>
              </div>

              {isEditingPassword && (
                <div className="space-y-3 animate-fadeIn">
                  <div>
                    <label className="block text-gray-600 text-sm font-medium mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      placeholder="Enter new password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={passwordLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm font-medium mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      placeholder="Confirm new password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={passwordLoading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handlePasswordChange}
                    disabled={passwordLoading}
                    className={`w-full py-2 px-4 rounded-lg font-medium text-white ${
                      passwordLoading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {passwordLoading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

const InputField = ({ label, value, disabled }) => (
  <div>
    <label className="block text-gray-600 text-sm font-medium mb-1">
      {label}
    </label>
    <input
      type="text"
      value={value}
      disabled={disabled}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed focus:outline-none focus:ring-0"
      readOnly
    />
  </div>
);

export default ProfileComponent;