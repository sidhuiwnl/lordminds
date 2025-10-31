import React, { useState, useEffect } from "react";

const ProfileComponent = () => {
  const [user, setUser] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-gray-500 text-lg">No user data found.</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8 transition-all">
        {/* Profile Image */}
        <div className="flex flex-col items-center relative">
          <div className="relative">
            <img
              src={
                previewImage ||
                user.profileImage ||
                "https://ui-avatars.com/api/?name=" +
                  encodeURIComponent(user.name || "User")
              }
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover border-4 border-blue-500 shadow-sm"
            />
            <label
              htmlFor="upload"
              className="absolute bottom-0 right-0 bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 shadow-md"
            >
              <span className="text-lg font-bold">+</span>
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
            {user.name || "No Name"}
          </h2>
          <p className="text-gray-500">{user.email || "No Email"}</p>
        </div>

        {/* User Info */}
        <div className="mt-6 space-y-3 border-t border-gray-200 pt-4">
          <InfoItem label="Phone" value={user.phone || "N/A"} />
          <InfoItem label="Address" value={user.address || "N/A"} />
          <InfoItem
            label="Joined"
            value={
              user.created_at
                ? new Date(user.created_at).toLocaleDateString()
                : "N/A"
            }
          />
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-gray-600 font-medium">{label}</span>
    <span className="text-gray-800">{value}</span>
  </div>
);

export default ProfileComponent;
