import React, { useState, useEffect } from "react";

const AdminProfileComponent = () => {
  const [user, setUser] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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
        // Update profile image URL immediately
        setUser((prev) => ({
          ...prev,
          profile_image: `${import.meta.env.VITE_BACKEND_API_URL}${data.file_url}`,
        }));
      } else {
        alert(data.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Something went wrong while uploading.");
    } finally {
      setUploading(false);
    }
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
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8 transition-all">
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
        </div>

        {/* User Info Form */}
        <form className="mt-6 space-y-4 border-t border-gray-200 pt-4">
          {user.username && (
            <InputField label="Username" value={user.username} disabled />
          )}
          {user.full_name && (
            <InputField label="Full Name" value={user.full_name} disabled />
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

export default AdminProfileComponent;